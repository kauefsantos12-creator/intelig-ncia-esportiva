-- Stage 4: prioritize post-match enrichment and derive starts from persisted lineups.
begin;

create or replace function public.claim_sports_job(p_worker_token uuid, p_lease_seconds integer default 120)
returns public.sports_jobs
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_job public.sports_jobs;
  v_lease_seconds integer := greatest(30, least(coalesce(p_lease_seconds, 120), 900));
begin
  if p_worker_token is null then raise exception 'worker token is required'; end if;
  update public.sports_jobs set status='DEAD',lease_token=null,lease_expires_at=null,
    completed_at=coalesce(completed_at,now()),updated_at=now()
  where attempts>=max_attempts and (((status in ('PENDING','FAILED')) and available_at<=now())
    or (status='RUNNING' and lease_expires_at<now()));

  select * into v_job from public.sports_jobs
  where attempts<max_attempts and (((status in ('PENDING','FAILED')) and available_at<=now())
    or (status='RUNNING' and lease_expires_at<now()))
  order by
    case job_type when 'API_FOOTBALL_FIXTURE_DATA' then 0 when 'API_FOOTBALL_LINK' then 1
      when 'BROADCAST_SYNC' then 2 when 'API_FOOTBALL_TEAM_SQUAD' then 3 else 4 end,
    available_at asc, created_at asc
  for update skip locked limit 1;
  if v_job.id is null then return null; end if;
  update public.sports_jobs set status='RUNNING',attempts=attempts+1,lease_token=p_worker_token,
    lease_expires_at=now()+make_interval(secs=>v_lease_seconds),completed_at=null,last_error=null,updated_at=now()
  where id=v_job.id returning * into v_job;
  return v_job;
end;
$function$;

create or replace view public.sports_player_period_aggregates
with (security_invoker = true)
as
select fps.player_id,fps.team_id,f.competition_id,f.season,fps.provider,
  min(f.kickoff_at) period_start,max(f.kickoff_at) period_end,
  count(*) filter (where fps.participation_state='PARTICIPATED')::integer appearances,
  count(*) filter (
    where fps.participation_state='PARTICIPATED'
      and exists (
        select 1 from public.sports_fixture_lineups l
        where l.fixture_id=fps.fixture_id and l.team_id=fps.team_id
          and l.player_id=fps.player_id and l.provider=fps.provider and l.is_starting=true
      )
  )::integer starts,
  coalesce(sum(fps.minutes),0)::integer minutes,
  avg(fps.provider_rating) provider_rating,count(*)::integer fixture_rows,max(fps.fetched_at) fetched_at
from public.sports_fixture_player_stats fps
join public.sports_fixtures f on f.id=fps.fixture_id
cross join public.sports_prospective_collection_state s
where f.kickoff_at>=s.day_zero_at
group by fps.player_id,fps.team_id,f.competition_id,f.season,fps.provider;

grant select on public.sports_player_period_aggregates to authenticated,service_role;

-- Give post-match jobs enough room to survive provider throttling without manual revival.
update public.sports_jobs
set max_attempts=greatest(max_attempts,12)
where job_type='API_FOOTBALL_FIXTURE_DATA'
  and status in ('PENDING','FAILED')
  and attempts<max_attempts;

commit;
