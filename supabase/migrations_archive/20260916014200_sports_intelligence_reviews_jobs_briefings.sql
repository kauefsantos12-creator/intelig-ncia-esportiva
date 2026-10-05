-- Motor de Inteligência Esportiva — anotações, fila operacional e noticiário.
begin;

create table public.sports_match_reviews (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  fixture_id uuid not null references public.sports_fixtures(id) on delete cascade,
  watched boolean,
  notes text,
  status text not null default 'PENDING' check (status in ('PENDING','COMPLETED','AUTO_CLOSED')),
  auto_closed boolean not null default false,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, fixture_id),
  constraint sports_match_reviews_unwatched_notes check (watched is distinct from false or notes is null),
  constraint sports_match_reviews_finalized check (
    (status = 'PENDING' and finalized_at is null) or
    (status <> 'PENDING' and finalized_at is not null)
  )
);
create index sports_match_reviews_queue_idx on public.sports_match_reviews(owner_id, status, created_at);

create table public.sports_player_personal_ratings (
  review_id uuid not null references public.sports_match_reviews(id) on delete cascade,
  player_id uuid not null references public.sports_players(id) on delete cascade,
  participation_state text not null default 'UNKNOWN' check (participation_state in ('PARTICIPATED','DID_NOT_PLAY','UNKNOWN')),
  rating numeric,
  provider_rating_snapshot numeric check (provider_rating_snapshot is null or (provider_rating_snapshot >= 0 and provider_rating_snapshot <= 10)),
  notes text,
  updated_at timestamptz not null default now(),
  primary key (review_id, player_id),
  constraint sports_personal_rating_range check (rating is null or (rating >= 0 and rating <= 10)),
  constraint sports_personal_rating_step check (rating is null or rating * 2 = trunc(rating * 2)),
  constraint sports_personal_rating_participation check (rating is null or participation_state = 'PARTICIPATED')
);

create table public.sports_sync_state (
  provider text not null,
  domain text not null,
  season text not null default '2026/27',
  cursor_value text,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (provider, domain, season)
);

create table public.sports_jobs (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  job_type text not null,
  fixture_id uuid references public.sports_fixtures(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'PENDING' check (status in ('PENDING','RUNNING','SUCCEEDED','FAILED','DEAD')),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 5 check (max_attempts between 1 and 20),
  available_at timestamptz not null default now(),
  lease_token uuid,
  lease_expires_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index sports_jobs_claim_idx on public.sports_jobs(status, available_at, created_at) where status in ('PENDING','FAILED');
create index sports_jobs_fixture_idx on public.sports_jobs(fixture_id, job_type, created_at desc);

create table public.sports_daily_briefings (
  id uuid primary key default gen_random_uuid(),
  briefing_date date not null unique,
  status text not null default 'DRAFT' check (status in ('DRAFT','READY','PUBLISHED','FAILED')),
  football_summary text,
  other_sports_summary text,
  facts_through timestamptz,
  generated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sports_briefing_items (
  id uuid primary key default gen_random_uuid(),
  briefing_id uuid not null references public.sports_daily_briefings(id) on delete cascade,
  fixture_id uuid references public.sports_fixtures(id) on delete set null,
  item_kind text not null check (item_kind in ('FOOTBALL_MATCH','ELO_MOVE','OTHER_SPORT','NEWS_CONTEXT')),
  title text not null,
  body text,
  priority integer not null default 100,
  facts jsonb not null default '{}'::jsonb,
  provenance jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index sports_briefing_items_order_idx on public.sports_briefing_items(briefing_id, priority, created_at);

commit;
