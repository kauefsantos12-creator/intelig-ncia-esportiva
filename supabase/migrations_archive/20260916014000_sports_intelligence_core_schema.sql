-- Motor de Inteligência Esportiva — catálogo, partidas, estatísticas e fact packs.
begin;

create table public.sports_competitions (
  id uuid primary key default gen_random_uuid(),
  canonical_key text not null unique,
  name text not null,
  country_code text,
  region text,
  competition_kind text not null check (competition_kind in ('LEAGUE','CUP','CONTINENTAL','NATIONAL_TEAM','OTHER')),
  division_level integer check (division_level is null or division_level > 0),
  season text not null default '2026/27',
  five_dollar_league_id bigint,
  api_football_league_id bigint,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index sports_competitions_five_dollar_uidx on public.sports_competitions(five_dollar_league_id) where five_dollar_league_id is not null;
create unique index sports_competitions_api_football_uidx on public.sports_competitions(api_football_league_id) where api_football_league_id is not null;
create index sports_competitions_scope_idx on public.sports_competitions(region, country_code, competition_kind, division_level) where active;

create table public.sports_teams (
  id uuid primary key default gen_random_uuid(),
  canonical_key text not null unique,
  name text not null,
  short_name text,
  country_code text,
  region text,
  five_dollar_team_id bigint,
  api_football_team_id bigint,
  logo_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index sports_teams_five_dollar_uidx on public.sports_teams(five_dollar_team_id) where five_dollar_team_id is not null;
create unique index sports_teams_api_football_uidx on public.sports_teams(api_football_team_id) where api_football_team_id is not null;
create index sports_teams_scope_idx on public.sports_teams(region, country_code, name);

create table public.sports_fixtures (
  id uuid primary key default gen_random_uuid(),
  canonical_key text not null unique,
  primary_provider text not null,
  primary_fixture_id text not null,
  five_dollar_fixture_id bigint,
  api_football_fixture_id bigint,
  competition_id uuid not null references public.sports_competitions(id) on delete restrict,
  season text not null default '2026/27',
  kickoff_at timestamptz not null,
  status text not null default 'SCHEDULED' check (status in ('SCHEDULED','LIVE','FINISHED','POSTPONED','CANCELLED','UNKNOWN')),
  home_team_id uuid not null references public.sports_teams(id) on delete restrict,
  away_team_id uuid not null references public.sports_teams(id) on delete restrict,
  home_goals integer check (home_goals is null or home_goals >= 0),
  away_goals integer check (away_goals is null or away_goals >= 0),
  finished_at timestamptz,
  source_fetched_at timestamptz,
  source_payload_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sports_fixtures_distinct_teams check (home_team_id <> away_team_id),
  constraint sports_fixtures_primary_provider_unique unique (primary_provider, primary_fixture_id)
);
create unique index sports_fixtures_five_dollar_uidx on public.sports_fixtures(five_dollar_fixture_id) where five_dollar_fixture_id is not null;
create unique index sports_fixtures_api_football_uidx on public.sports_fixtures(api_football_fixture_id) where api_football_fixture_id is not null;
create index sports_fixtures_day_idx on public.sports_fixtures(kickoff_at, status);
create index sports_fixtures_competition_idx on public.sports_fixtures(competition_id, season, kickoff_at desc);
create index sports_fixtures_home_idx on public.sports_fixtures(home_team_id, kickoff_at desc);
create index sports_fixtures_away_idx on public.sports_fixtures(away_team_id, kickoff_at desc);

create table public.sports_fixture_team_stats (
  fixture_id uuid not null references public.sports_fixtures(id) on delete cascade,
  team_id uuid not null references public.sports_teams(id) on delete restrict,
  stat_key text not null,
  stat_value numeric,
  stat_text text,
  unit text,
  provider text not null,
  observed_at timestamptz,
  fetched_at timestamptz not null default now(),
  raw_hash text,
  metadata jsonb not null default '{}'::jsonb,
  primary key (fixture_id, team_id, stat_key, provider),
  constraint sports_fixture_team_stats_value_present check (stat_value is not null or stat_text is not null)
);
create index sports_fixture_team_stats_team_idx on public.sports_fixture_team_stats(team_id, stat_key, fetched_at desc);

create table public.sports_fixture_events (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references public.sports_fixtures(id) on delete cascade,
  provider text not null,
  external_event_id text,
  minute integer check (minute is null or minute >= 0),
  added_minute integer check (added_minute is null or added_minute >= 0),
  event_type text not null,
  detail text,
  team_id uuid references public.sports_teams(id) on delete set null,
  player_external_id text,
  player_name text,
  metadata jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now()
);
create unique index sports_fixture_events_external_uidx on public.sports_fixture_events(fixture_id, provider, external_event_id) where external_event_id is not null;
create index sports_fixture_events_timeline_idx on public.sports_fixture_events(fixture_id, minute, added_minute);

create table public.sports_match_fact_packs (
  fixture_id uuid primary key references public.sports_fixtures(id) on delete cascade,
  definition_version text not null default 'fact-pack-v1',
  payload jsonb not null,
  checksum text,
  source_fetched_at timestamptz,
  generated_at timestamptz not null default now()
);

commit;
