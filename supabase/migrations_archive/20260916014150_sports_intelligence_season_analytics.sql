-- Motor de Inteligência Esportiva — dados normalizados de temporada para Analytics 26/27.
begin;

create table public.sports_standings (
  competition_id uuid not null references public.sports_competitions(id) on delete cascade,
  season text not null default '2026/27',
  team_id uuid not null references public.sports_teams(id) on delete cascade,
  provider text not null,
  position integer check (position is null or position > 0),
  played integer check (played is null or played >= 0),
  wins integer check (wins is null or wins >= 0),
  draws integer check (draws is null or draws >= 0),
  losses integer check (losses is null or losses >= 0),
  goals_for integer check (goals_for is null or goals_for >= 0),
  goals_against integer check (goals_against is null or goals_against >= 0),
  points integer,
  form text,
  payload jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  primary key (competition_id, season, team_id, provider)
);
create index sports_standings_order_idx on public.sports_standings(competition_id, season, position);

create table public.sports_player_season_stats (
  player_id uuid not null references public.sports_players(id) on delete cascade,
  team_id uuid not null references public.sports_teams(id) on delete cascade,
  competition_id uuid not null references public.sports_competitions(id) on delete cascade,
  season text not null default '2026/27',
  provider text not null,
  appearances integer check (appearances is null or appearances >= 0),
  starts integer check (starts is null or starts >= 0),
  minutes integer check (minutes is null or minutes >= 0),
  provider_rating numeric check (provider_rating is null or (provider_rating >= 0 and provider_rating <= 10)),
  stats jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  primary key (player_id, team_id, competition_id, season, provider)
);
create index sports_player_season_stats_team_idx on public.sports_player_season_stats(team_id, competition_id, season);
create index sports_player_season_stats_player_idx on public.sports_player_season_stats(player_id, season);

commit;
