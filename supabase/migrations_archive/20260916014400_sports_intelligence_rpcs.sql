-- Motor de Inteligência Esportiva — operações atômicas do backend.
begin;

create or replace function public.sports_fixture_is_always_track(p_fixture_id uuid)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.sports_fixtures f
    join public.sports_competitions c on c.id = f.competition_id
    join public.sports_tracking_rules r on r.enabled and r.always_track
    where f.id = p_fixture_id
      and (
        r.competition_id = c.id
        or (
          r.competition_id is null
          and (r.country_code is null or r.country_code = c.country_code)
          and (r.region is null or r.region = c.region)
          and (r.competition_kind is null or r.competition_kind = c.competition_kind)
          and (r.division_level is null or r.division_level = c.division_level)
        )
      )
  );
$$;

create or replace function public.sports_fixture_is_review_eligible(p_fixture_id uuid)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select public.sports_fixture_is_always_track(p_fixture_id)
      or exists (select 1 from public.sports_broadcast_evidence b where b.fixture_id = p_fixture_id);
$$;

grant execute on function public.sports_fixture_is_always_track(uuid) to authenticated, service_role;
grant execute on function public.sports_fixture_is_review_eligible(uuid) to authenticated, service_role;

create or replace function public.enqueue_finished_sports_reviews(
  p_owner_id uuid,
  p_limit integer default 100
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  if p_owner_id is null then
    raise exception 'owner_id is required';
  end if;

  with eligible as (
    select f.id
    from public.sports_fixtures f
    where f.status = 'FINISHED'
      and public.sports_fixture_is_review_eligible(f.id)
      and not exists (
        select 1 from public.sports_match_reviews r
        where r.owner_id = p_owner_id and r.fixture_id = f.id
      )
    order by f.kickoff_at asc
    limit greatest(1, least(coalesce(p_limit, 100), 500))
  ), inserted as (
    insert into public.sports_match_reviews(owner_id, fixture_id)
    select p_owner_id, e.id from eligible e
    on conflict (owner_id, fixture_id) do nothing
    returning 1
  )
  select count(*) into v_count from inserted;

  return v_count;
end;
$$;
revoke all on function public.enqueue_finished_sports_reviews(uuid, integer) from public, anon, authenticated;
grant execute on function public.enqueue_finished_sports_reviews(uuid, integer) to service_role;

create or replace function public.auto_close_sports_reviews(
  p_owner_id uuid,
  p_cutoff timestamptz
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ids uuid[];
  v_count integer := 0;
begin
  select coalesce(array_agg(r.id), array[]::uuid[])
  into v_ids
  from public.sports_match_reviews r
  join public.sports_fixtures f on f.id = r.fixture_id
  where r.owner_id = p_owner_id
    and r.status = 'PENDING'
    and f.status = 'FINISHED'
    and f.finished_at is not null
    and f.finished_at <= p_cutoff;

  if cardinality(v_ids) = 0 then
    return 0;
  end if;

  update public.sports_player_personal_ratings
  set rating = null,
      notes = null,
      updated_at = now()
  where review_id = any(v_ids);

  update public.sports_match_reviews
  set watched = false,
      notes = null,
      status = 'AUTO_CLOSED',
      auto_closed = true,
      finalized_at = now(),
      updated_at = now()
  where id = any(v_ids);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.auto_close_sports_reviews(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.auto_close_sports_reviews(uuid, timestamptz) to service_role;

create or replace function public.enqueue_sports_job(
  p_idempotency_key text,
  p_job_type text,
  p_fixture_id uuid default null,
  p_payload jsonb default '{}'::jsonb,
  p_max_attempts integer default 5
)
returns public.sports_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.sports_jobs;
begin
  if nullif(btrim(p_idempotency_key), '') is null or nullif(btrim(p_job_type), '') is null then
    raise exception 'idempotency_key and job_type are required';
  end if;

  insert into public.sports_jobs(
    idempotency_key, job_type, fixture_id, payload, max_attempts
  ) values (
    btrim(p_idempotency_key), btrim(p_job_type), p_fixture_id,
    coalesce(p_payload, '{}'::jsonb), greatest(1, least(coalesce(p_max_attempts, 5), 20))
  )
  on conflict (idempotency_key) do update
  set payload = excluded.payload,
      updated_at = now()
  returning * into v_job;

  return v_job;
end;
$$;
revoke all on function public.enqueue_sports_job(text, text, uuid, jsonb, integer) from public, anon, authenticated;
grant execute on function public.enqueue_sports_job(text, text, uuid, jsonb, integer) to service_role;

create or replace function public.claim_sports_job(
  p_worker_token uuid,
  p_lease_seconds integer default 120
)
returns public.sports_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.sports_jobs;
  v_lease_seconds integer := greatest(30, least(coalesce(p_lease_seconds, 120), 900));
begin
  if p_worker_token is null then
    raise exception 'worker token is required';
  end if;

  select * into v_job
  from public.sports_jobs
  where (
      status in ('PENDING','FAILED') and available_at <= now()
    ) or (
      status = 'RUNNING' and lease_expires_at < now()
    )
  order by available_at asc, created_at asc
  for update skip locked
  limit 1;

  if v_job.id is null then
    return null;
  end if;

  update public.sports_jobs
  set status = 'RUNNING',
      attempts = attempts + 1,
      lease_token = p_worker_token,
      lease_expires_at = now() + make_interval(secs => v_lease_seconds),
      last_error = null,
      updated_at = now()
  where id = v_job.id
  returning * into v_job;

  return v_job;
end;
$$;
revoke all on function public.claim_sports_job(uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_sports_job(uuid, integer) to service_role;

create or replace function public.complete_sports_job(
  p_job_id uuid,
  p_worker_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  update public.sports_jobs
  set status = 'SUCCEEDED',
      completed_at = now(),
      lease_token = null,
      lease_expires_at = null,
      last_error = null,
      updated_at = now()
  where id = p_job_id
    and status = 'RUNNING'
    and lease_token = p_worker_token;
  get diagnostics v_count = row_count;
  return v_count = 1;
end;
$$;
revoke all on function public.complete_sports_job(uuid, uuid) from public, anon, authenticated;
grant execute on function public.complete_sports_job(uuid, uuid) to service_role;

create or replace function public.fail_sports_job(
  p_job_id uuid,
  p_worker_token uuid,
  p_error text,
  p_retry_after_seconds integer default 60
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status text;
begin
  update public.sports_jobs
  set status = case when attempts >= max_attempts then 'DEAD' else 'FAILED' end,
      available_at = case
        when attempts >= max_attempts then available_at
        else now() + make_interval(secs => greatest(5, least(coalesce(p_retry_after_seconds, 60), 3600)))
      end,
      lease_token = null,
      lease_expires_at = null,
      last_error = left(coalesce(p_error, 'unknown failure'), 4000),
      updated_at = now(),
      completed_at = case when attempts >= max_attempts then now() else null end
  where id = p_job_id
    and status = 'RUNNING'
    and lease_token = p_worker_token
  returning status into v_status;

  return v_status;
end;
$$;
revoke all on function public.fail_sports_job(uuid, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.fail_sports_job(uuid, uuid, text, integer) to service_role;

create or replace function public.sports_review_team_ratings(p_review_id uuid)
returns table(
  team_id uuid,
  participants integer,
  rated_players integer,
  personal_average numeric,
  complete boolean
)
language sql
stable
set search_path = public, pg_temp
as $$
  with review_fixture as (
    select fixture_id from public.sports_match_reviews where id = p_review_id
  ), participants as (
    select fps.team_id, fps.player_id
    from public.sports_fixture_player_stats fps
    join review_fixture rf on rf.fixture_id = fps.fixture_id
    where fps.participation_state = 'PARTICIPATED'
    group by fps.team_id, fps.player_id
  ), joined as (
    select p.team_id, p.player_id, pr.rating
    from participants p
    left join public.sports_player_personal_ratings pr
      on pr.review_id = p_review_id and pr.player_id = p.player_id
  )
  select
    team_id,
    count(*)::integer as participants,
    count(rating)::integer as rated_players,
    case when count(*) > 0 and count(rating) = count(*) then avg(rating) else null end as personal_average,
    count(*) > 0 and count(rating) = count(*) as complete
  from joined
  group by team_id;
$$;
grant execute on function public.sports_review_team_ratings(uuid) to authenticated, service_role;

commit;
