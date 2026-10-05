-- Today agenda v2 — apply canonical tracked scope before display LIMIT.
begin;

create or replace function public.get_today_tracked_fixtures(
  p_start timestamptz,
  p_end timestamptz,
  p_limit integer default 300
)
returns table (
  fixture_id uuid,
  kickoff_at timestamptz,
  status text,
  home_goals integer,
  away_goals integer,
  competition_id uuid,
  competition_name text,
  competition_kind text,
  division_level integer,
  country_code text,
  region text,
  home_team_id uuid,
  home_team_name text,
  home_team_logo text,
  home_five_dollar_team_id bigint,
  away_team_id uuid,
  away_team_name text,
  away_team_logo text,
  away_five_dollar_team_id bigint
)
language sql
stable
security invoker
set search_path=''
as $$
  select
    f.id,
    f.kickoff_at,
    f.status,
    f.home_goals::integer,
    f.away_goals::integer,
    c.id,
    c.name,
    c.competition_kind,
    c.division_level,
    c.country_code,
    c.region,
    h.id,
    h.name,
    coalesce(
      nullif(trim(h.logo_url),''),
      case
        when h.api_football_team_id is not null
          then 'https://media.api-sports.io/football/teams/'||h.api_football_team_id::text||'.png'
      end
    ),
    h.five_dollar_team_id,
    a.id,
    a.name,
    coalesce(
      nullif(trim(a.logo_url),''),
      case
        when a.api_football_team_id is not null
          then 'https://media.api-sports.io/football/teams/'||a.api_football_team_id::text||'.png'
      end
    ),
    a.five_dollar_team_id
  from public.sports_fixtures f
  join public.sports_competitions c on c.id=f.competition_id
  join public.sports_teams h on h.id=f.home_team_id
  join public.sports_teams a on a.id=f.away_team_id
  where f.kickoff_at>=p_start
    and f.kickoff_at<p_end
    and exists (
      select 1
      from public.sports_tracking_rules tr
      where tr.enabled=true
        and tr.always_track=true
        and (
          (tr.competition_id is not null and tr.competition_id=f.competition_id)
          or (
            tr.competition_id is null
            and (tr.country_code is null or tr.country_code=c.country_code)
            and (tr.region is null or tr.region=c.region)
            and (tr.competition_kind is null or tr.competition_kind=c.competition_kind)
            and (tr.division_level is null or tr.division_level=c.division_level)
          )
        )
    )
  order by f.kickoff_at asc,f.id
  limit least(greatest(coalesce(p_limit,300),1),500);
$$;

revoke all on function public.get_today_tracked_fixtures(timestamptz,timestamptz,integer)
  from public,anon,authenticated;
grant execute on function public.get_today_tracked_fixtures(timestamptz,timestamptz,integer)
  to service_role;

commit;
