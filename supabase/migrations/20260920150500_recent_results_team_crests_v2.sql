-- Resultados recentes v2 — filtrar o escopo antes do LIMIT e completar escudos conhecidos.
begin;

update public.sports_teams
set
  logo_url='https://media.api-sports.io/football/teams/'||api_football_team_id::text||'.png',
  metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
    'logo_source','api_football_media',
    'logo_backfilled_at',now()
  ),
  updated_at=now()
where api_football_team_id is not null
  and nullif(trim(logo_url),'') is null;

create or replace function public.get_recent_priority_results(
  p_since timestamptz,
  p_limit integer default 12
)
returns table (
  fixture_id uuid,
  kickoff_at timestamptz,
  competition_id uuid,
  competition text,
  competition_kind text,
  division_level integer,
  country_code text,
  region text,
  home_team_id uuid,
  home_team text,
  home_team_logo text,
  away_team_id uuid,
  away_team text,
  away_team_logo text,
  home_goals integer,
  away_goals integer
)
language sql
stable
security invoker
set search_path=''
as $$
  select
    f.id,
    f.kickoff_at,
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
    a.id,
    a.name,
    coalesce(
      nullif(trim(a.logo_url),''),
      case
        when a.api_football_team_id is not null
          then 'https://media.api-sports.io/football/teams/'||a.api_football_team_id::text||'.png'
      end
    ),
    f.home_goals::integer,
    f.away_goals::integer
  from public.sports_fixtures f
  join public.sports_teams h on h.id=f.home_team_id
  join public.sports_teams a on a.id=f.away_team_id
  join public.sports_competitions c on c.id=f.competition_id
  where f.status='FINISHED'
    and f.kickoff_at>=p_since
    and exists (
      select 1
      from public.sports_tracking_rules tr
      where tr.enabled=true
        and tr.always_track=true
        and (
          (tr.competition_id is not null and tr.competition_id=f.competition_id)
          or
          (
            tr.competition_id is null
            and (tr.country_code is null or tr.country_code=c.country_code)
            and (tr.region is null or tr.region=c.region)
            and (tr.competition_kind is null or tr.competition_kind=c.competition_kind)
            and (tr.division_level is null or tr.division_level=c.division_level)
          )
        )
    )
  order by f.kickoff_at desc,f.id
  limit least(greatest(coalesce(p_limit,12),1),50);
$$;

revoke all on function public.get_recent_priority_results(timestamptz,integer)
  from public,anon,authenticated;
grant execute on function public.get_recent_priority_results(timestamptz,integer)
  to service_role;

commit;
