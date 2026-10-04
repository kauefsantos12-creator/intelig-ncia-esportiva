-- Today recent form v3 — align the operational lookback with the "last 5 matches" product promise.
begin;

create or replace function public.enqueue_today_recent_form_backfill(
  p_date date default ((now() at time zone 'America/Sao_Paulo')::date)
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_start timestamptz := (p_date::timestamp at time zone 'America/Sao_Paulo');
  v_end timestamptz := ((p_date + 1)::timestamp at time zone 'America/Sao_Paulo');
  v_jobs integer := 0;
  v_teams integer := 0;
  v_job public.sports_jobs;
  r record;
begin
  for r in
    with today as (
      select *
      from public.get_today_tracked_fixtures(v_start,v_end,300)
    ),
    teams as (
      select
        competition_id,
        home_team_id as sports_team_id,
        home_five_dollar_team_id as five_dollar_team_id
      from today
      union
      select
        competition_id,
        away_team_id,
        away_five_dollar_team_id
      from today
    ),
    deficient as (
      select t.*
      from teams t
      where t.five_dollar_team_id is not null
        and (
          select count(*)
          from public.sports_fixtures f
          where f.status='FINISHED'
            and f.kickoff_at>=v_start-interval '365 days'
            and f.kickoff_at<v_start
            and f.home_goals is not null
            and f.away_goals is not null
            and (f.home_team_id=t.sports_team_id or f.away_team_id=t.sports_team_id)
        ) < 5
    )
    select
      c.five_dollar_league_id as league_id,
      array_agg(distinct d.five_dollar_team_id order by d.five_dollar_team_id) as team_ids,
      count(distinct d.five_dollar_team_id)::integer as team_count
    from deficient d
    join public.sports_competitions c on c.id=d.competition_id
    where c.five_dollar_league_id is not null
    group by c.five_dollar_league_id
    order by c.five_dollar_league_id
  loop
    select *
    into v_job
    from public.enqueue_sports_job(
      'recent-form-history:'||p_date::text||':'||r.league_id::text,
      'FIVE_DOLLAR_RECENT_FORM_LEAGUE',
      null,
      jsonb_build_object(
        'date',p_date::text,
        'leagueId',r.league_id,
        'teamIds',to_jsonb(r.team_ids)
      ),
      5
    );

    v_jobs := v_jobs + 1;
    v_teams := v_teams + r.team_count;
  end loop;

  return jsonb_build_object(
    'status','QUEUED',
    'date',p_date,
    'jobs',v_jobs,
    'deficient_teams',v_teams,
    'queued_at',now()
  );
end;
$function$;

revoke all on function public.enqueue_today_recent_form_backfill(date)
  from public,anon,authenticated;
grant execute on function public.enqueue_today_recent_form_backfill(date)
  to service_role;

commit;
