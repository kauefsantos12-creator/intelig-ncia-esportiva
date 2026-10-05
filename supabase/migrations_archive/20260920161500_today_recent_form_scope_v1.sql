-- Today recent form v1 — scope historical fixtures to today's teams before limiting per team.
begin;

create or replace function public.get_recent_team_fixtures(
  p_team_ids uuid[],
  p_since timestamptz,
  p_until timestamptz,
  p_per_team integer default 5
)
returns table (
  fixture_id uuid,
  kickoff_at timestamptz,
  home_team_id uuid,
  away_team_id uuid,
  home_goals integer,
  away_goals integer
)
language sql
stable
security invoker
set search_path=''
as $$
  with target_teams as (
    select distinct team_id
    from unnest(coalesce(p_team_ids,'{}'::uuid[])) as team_id
    where team_id is not null
  ),
  ranked as (
    select
      tt.team_id as target_team_id,
      f.id as fixture_id,
      f.kickoff_at,
      f.home_team_id,
      f.away_team_id,
      f.home_goals::integer as home_goals,
      f.away_goals::integer as away_goals,
      row_number() over (
        partition by tt.team_id
        order by f.kickoff_at desc,f.id desc
      ) as recent_rank
    from target_teams tt
    join public.sports_fixtures f
      on f.home_team_id=tt.team_id or f.away_team_id=tt.team_id
    where f.status='FINISHED'
      and f.kickoff_at>=p_since
      and f.kickoff_at<p_until
      and f.home_goals is not null
      and f.away_goals is not null
  ),
  selected as (
    select *
    from ranked
    where recent_rank<=least(greatest(coalesce(p_per_team,5),1),10)
  ),
  deduplicated as (
    select distinct on (fixture_id)
      fixture_id,
      kickoff_at,
      home_team_id,
      away_team_id,
      home_goals,
      away_goals
    from selected
    order by fixture_id,kickoff_at desc
  )
  select
    fixture_id,
    kickoff_at,
    home_team_id,
    away_team_id,
    home_goals,
    away_goals
  from deduplicated
  order by kickoff_at desc,fixture_id desc;
$$;

revoke all on function public.get_recent_team_fixtures(uuid[],timestamptz,timestamptz,integer)
  from public,anon,authenticated;
grant execute on function public.get_recent_team_fixtures(uuid[],timestamptz,timestamptz,integer)
  to service_role;

commit;
