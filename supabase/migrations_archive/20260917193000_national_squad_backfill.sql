-- Motor de Inteligência Esportiva — catálogo nacional e backfill de elencos.
begin;

create table public.sports_team_competitions (
  competition_id uuid not null references public.sports_competitions(id) on delete cascade,
  team_id uuid not null references public.sports_teams(id) on delete cascade,
  season text not null default '2026/27',
  provider text not null,
  active boolean not null default true,
  fetched_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  primary key (competition_id, team_id, season, provider)
);
create index sports_team_competitions_team_idx
  on public.sports_team_competitions(team_id, season, active);

alter table public.sports_team_competitions enable row level security;
create policy sports_team_competitions_authenticated_read
  on public.sports_team_competitions for select to authenticated using (true);
revoke all on table public.sports_team_competitions from anon;
grant select on table public.sports_team_competitions to authenticated;
grant all on table public.sports_team_competitions to service_role;

-- Completa o catálogo canônico das seis ligas prioritárias sem duplicar
-- competições que já receberam o vínculo API-Football via fixtures.
update public.sports_competitions set
  name = 'English Premier League', country_code = 'GB-ENG', region = 'EUROPE',
  competition_kind = 'LEAGUE', division_level = 1, active = true
where api_football_league_id = 39 and season = '2026/27';
update public.sports_competitions set
  name = 'France Ligue 1', country_code = 'FR', region = 'EUROPE',
  competition_kind = 'LEAGUE', division_level = 1, active = true
where api_football_league_id = 61 and season = '2026/27';
update public.sports_competitions set
  name = 'Germany Bundesliga', country_code = 'DE', region = 'EUROPE',
  competition_kind = 'LEAGUE', division_level = 1, active = true
where api_football_league_id = 78 and season = '2026/27';
update public.sports_competitions set
  name = 'Italy Serie A', country_code = 'IT', region = 'EUROPE',
  competition_kind = 'LEAGUE', division_level = 1, active = true
where api_football_league_id = 135 and season = '2026/27';
update public.sports_competitions set
  name = 'Spain La Liga', country_code = 'ES', region = 'EUROPE',
  competition_kind = 'LEAGUE', division_level = 1, active = true
where api_football_league_id = 140 and season = '2026/27';
update public.sports_competitions set
  name = 'Brazil Serie A', country_code = 'BR', region = 'SOUTH_AMERICA',
  competition_kind = 'LEAGUE', division_level = 1, active = true
where api_football_league_id = 71 and season = '2026/27';

insert into public.sports_competitions (
  canonical_key, name, country_code, region, competition_kind, division_level,
  season, api_football_league_id, active, metadata
)
select seed.canonical_key, seed.name, seed.country_code, seed.region, 'LEAGUE', 1,
       '2026/27', seed.league_id, true, jsonb_build_object('source','api_football','priority','national_squad_backfill')
from (values
  ('api-football:league:39:2026', 'English Premier League', 'GB-ENG', 'EUROPE', 39),
  ('api-football:league:61:2026', 'France Ligue 1', 'FR', 'EUROPE', 61),
  ('api-football:league:78:2026', 'Germany Bundesliga', 'DE', 'EUROPE', 78),
  ('api-football:league:135:2026', 'Italy Serie A', 'IT', 'EUROPE', 135),
  ('api-football:league:140:2026', 'Spain La Liga', 'ES', 'EUROPE', 140),
  ('api-football:league:71:2026', 'Brazil Serie A', 'BR', 'SOUTH_AMERICA', 71)
) as seed(canonical_key,name,country_code,region,league_id)
where not exists (
  select 1 from public.sports_competitions c
  where c.api_football_league_id = seed.league_id and c.season = '2026/27'
);

commit;