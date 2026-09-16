-- Motor de Inteligência Esportiva — jogadores, escalações, lesões e transmissão.
begin;

create table public.sports_players (
  id uuid primary key default gen_random_uuid(),
  canonical_key text not null unique,
  name text not null,
  date_of_birth date,
  nationality text,
  five_dollar_player_id bigint,
  api_football_player_id bigint,
  photo_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index sports_players_five_dollar_uidx on public.sports_players(five_dollar_player_id) where five_dollar_player_id is not null;
create unique index sports_players_api_football_uidx on public.sports_players(api_football_player_id) where api_football_player_id is not null;
create index sports_players_name_idx on public.sports_players(name);

create table public.sports_team_squads (
  team_id uuid not null references public.sports_teams(id) on delete cascade,
  player_id uuid not null references public.sports_players(id) on delete cascade,
  season text not null default '2026/27',
  provider text not null,
  jersey_number integer check (jersey_number is null or jersey_number between 0 and 99),
  position text,
  active boolean not null default true,
  fetched_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  primary key (team_id, player_id, season, provider)
);

create table public.sports_fixture_lineups (
  fixture_id uuid not null references public.sports_fixtures(id) on delete cascade,
  team_id uuid not null references public.sports_teams(id) on delete cascade,
  player_id uuid not null references public.sports_players(id) on delete cascade,
  provider text not null,
  is_starting boolean not null default false,
  is_substitute boolean not null default false,
  position text,
  grid_position text,
  jersey_number integer check (jersey_number is null or jersey_number between 0 and 99),
  formation text,
  fetched_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  primary key (fixture_id, team_id, player_id, provider),
  constraint sports_fixture_lineups_role check (not (is_starting and is_substitute))
);
create index sports_fixture_lineups_fixture_idx on public.sports_fixture_lineups(fixture_id, team_id, is_starting desc);

create table public.sports_fixture_player_stats (
  fixture_id uuid not null references public.sports_fixtures(id) on delete cascade,
  team_id uuid not null references public.sports_teams(id) on delete cascade,
  player_id uuid not null references public.sports_players(id) on delete cascade,
  provider text not null,
  participation_state text not null default 'UNKNOWN' check (participation_state in ('PARTICIPATED','DID_NOT_PLAY','UNKNOWN')),
  minutes integer check (minutes is null or minutes between 0 and 150),
  provider_rating numeric check (provider_rating is null or (provider_rating >= 0 and provider_rating <= 10)),
  stats jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  primary key (fixture_id, player_id, provider)
);
create index sports_fixture_player_stats_team_idx on public.sports_fixture_player_stats(team_id, fixture_id);
create index sports_fixture_player_stats_player_idx on public.sports_fixture_player_stats(player_id, fixture_id);

create table public.sports_injuries (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid references public.sports_fixtures(id) on delete cascade,
  team_id uuid references public.sports_teams(id) on delete cascade,
  player_id uuid references public.sports_players(id) on delete cascade,
  provider text not null,
  injury_type text,
  reason text,
  starts_at timestamptz,
  ends_at timestamptz,
  fetched_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index sports_injuries_fixture_idx on public.sports_injuries(fixture_id, team_id);
create index sports_injuries_player_idx on public.sports_injuries(player_id, fetched_at desc);

create table public.sports_broadcast_evidence (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references public.sports_fixtures(id) on delete cascade,
  broadcaster text not null,
  platform text,
  source_kind text not null check (source_kind in ('OFFICIAL','FUTNATV','AGGREGATOR','MANUAL')),
  source_name text not null,
  source_url text,
  checked_at timestamptz not null,
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  is_primary boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index sports_broadcast_evidence_fixture_idx on public.sports_broadcast_evidence(fixture_id, checked_at desc);
create unique index sports_broadcast_evidence_primary_uidx on public.sports_broadcast_evidence(fixture_id) where is_primary;

create table public.sports_tracking_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  competition_id uuid references public.sports_competitions(id) on delete cascade,
  country_code text,
  region text,
  competition_kind text check (competition_kind is null or competition_kind in ('LEAGUE','CUP','CONTINENTAL','NATIONAL_TEAM','OTHER')),
  division_level integer check (division_level is null or division_level > 0),
  always_track boolean not null default true,
  enabled boolean not null default true,
  priority integer not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sports_tracking_rules_scope check (competition_id is not null or country_code is not null or region is not null)
);
create index sports_tracking_rules_scope_idx on public.sports_tracking_rules(region, country_code, competition_kind, division_level) where enabled;

insert into public.sports_tracking_rules (rule_key, country_code, region, competition_kind, division_level, priority, metadata)
values
  ('always-england-top-league', 'GB-ENG', null, 'LEAGUE', 1, 100, '{"label":"Premier League"}'::jsonb),
  ('always-germany-top-league', 'DE', null, 'LEAGUE', 1, 100, '{"label":"Bundesliga"}'::jsonb),
  ('always-france-top-league', 'FR', null, 'LEAGUE', 1, 100, '{"label":"Ligue 1"}'::jsonb),
  ('always-italy-top-league', 'IT', null, 'LEAGUE', 1, 100, '{"label":"Serie A"}'::jsonb),
  ('always-spain-top-league', 'ES', null, 'LEAGUE', 1, 100, '{"label":"La Liga"}'::jsonb),
  ('always-brazil-top-league', 'BR', null, 'LEAGUE', 1, 100, '{"label":"Serie A brasileira"}'::jsonb),
  ('always-europe-continental', null, 'EUROPE', 'CONTINENTAL', null, 90, '{"label":"Competições continentais europeias"}'::jsonb),
  ('always-south-america-continental', null, 'SOUTH_AMERICA', 'CONTINENTAL', null, 90, '{"label":"Competições continentais sul-americanas"}'::jsonb);

commit;
