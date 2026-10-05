-- Noticiário: movimentos Elo canônicos, filtrados e ordenados antes do LIMIT.
begin;

create or replace function public.get_recent_elo_movements(
  p_since timestamptz,
  p_limit integer default 8
)
returns table (
  fixture_id bigint,
  kickoff_at timestamptz,
  league_name text,
  team_id bigint,
  team_name text,
  opponent_id bigint,
  opponent_name text,
  goals_for integer,
  goals_against integer,
  rating_before numeric,
  rating_after numeric,
  delta numeric
)
language sql
stable
security invoker
set search_path=''
as $$
  with canonical_history as (
    select
      h.fixture_id,
      h.kickoff_at,
      h.league_name,
      h.home_team_id,
      h.home_team_name,
      h.away_team_id,
      h.away_team_name,
      h.home_goals,
      h.away_goals,
      h.home_rating_before,
      h.home_rating_after,
      h.away_rating_before,
      h.away_rating_after
    from public.elo_fixture_history h
    where h.model_version='elo-v1-w020'
      and h.kickoff_at>=p_since
  ),
  movements as (
    select
      h.fixture_id,
      h.kickoff_at,
      h.league_name,
      h.home_team_id as team_id,
      h.home_team_name as team_name,
      h.away_team_id as opponent_id,
      h.away_team_name as opponent_name,
      h.home_goals::integer as goals_for,
      h.away_goals::integer as goals_against,
      h.home_rating_before::numeric as rating_before,
      h.home_rating_after::numeric as rating_after,
      (h.home_rating_after-h.home_rating_before)::numeric as delta
    from canonical_history h

    union all

    select
      h.fixture_id,
      h.kickoff_at,
      h.league_name,
      h.away_team_id as team_id,
      h.away_team_name as team_name,
      h.home_team_id as opponent_id,
      h.home_team_name as opponent_name,
      h.away_goals::integer as goals_for,
      h.home_goals::integer as goals_against,
      h.away_rating_before::numeric as rating_before,
      h.away_rating_after::numeric as rating_after,
      (h.away_rating_after-h.away_rating_before)::numeric as delta
    from canonical_history h
  )
  select
    m.fixture_id,
    m.kickoff_at,
    m.league_name,
    m.team_id,
    m.team_name,
    m.opponent_id,
    m.opponent_name,
    m.goals_for,
    m.goals_against,
    m.rating_before,
    m.rating_after,
    m.delta
  from movements m
  where abs(m.delta)>=2
  order by abs(m.delta) desc,m.kickoff_at desc,m.fixture_id desc,m.team_id
  limit least(greatest(coalesce(p_limit,8),1),50);
$$;

revoke all on function public.get_recent_elo_movements(timestamptz,integer)
  from public,anon,authenticated;
grant execute on function public.get_recent_elo_movements(timestamptz,integer)
  to service_role;

commit;
