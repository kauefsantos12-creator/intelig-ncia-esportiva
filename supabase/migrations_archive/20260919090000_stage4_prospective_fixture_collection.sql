-- Etapa 4 — Dia Zero prospectivo e agregados derivados exclusivamente de fixtures.
begin;

create table public.sports_prospective_collection_state (
  singleton boolean primary key default true check (singleton),
  day_zero_at timestamptz not null,
  activated_at timestamptz not null default now(),
  definition_version text not null default 'prospective-fixture-v1',
  metadata jsonb not null default '{}'::jsonb
);

insert into public.sports_prospective_collection_state (singleton, day_zero_at, metadata)
values (true, now(), '{"reason":"stage_3_116_of_116_validated","backfill":false}'::jsonb)
on conflict (singleton) do nothing;

alter table public.sports_prospective_collection_state enable row level security;
create policy sports_prospective_state_read on public.sports_prospective_collection_state
for select to authenticated using (true);
revoke insert, update, delete on public.sports_prospective_collection_state from anon, authenticated;
grant select on public.sports_prospective_collection_state to authenticated;
grant all on public.sports_prospective_collection_state to service_role;

create or replace function public.sports_fixture_is_prospective(p_fixture_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists (
    select 1
    from public.sports_fixtures f
    cross join public.sports_prospective_collection_state s
    where f.id = p_fixture_id
      and f.kickoff_at >= s.day_zero_at
  );
$$;
revoke all on function public.sports_fixture_is_prospective(uuid) from public, anon, authenticated;
grant execute on function public.sports_fixture_is_prospective(uuid) to service_role;

create or replace view public.sports_player_period_aggregates
with (security_invoker = true)
as
select
  fps.player_id,
  fps.team_id,
  f.competition_id,
  f.season,
  fps.provider,
  min(f.kickoff_at) as period_start,
  max(f.kickoff_at) as period_end,
  count(*) filter (where fps.participation_state = 'PARTICIPATED')::integer as appearances,
  count(*) filter (
    where fps.participation_state = 'PARTICIPATED'
      and coalesce((fps.stats->'games'->>'substitute')::boolean, false) = false
  )::integer as starts,
  coalesce(sum(fps.minutes),0)::integer as minutes,
  avg(fps.provider_rating) as provider_rating,
  count(*)::integer as fixture_rows,
  max(fps.fetched_at) as fetched_at
from public.sports_fixture_player_stats fps
join public.sports_fixtures f on f.id = fps.fixture_id
cross join public.sports_prospective_collection_state s
where f.kickoff_at >= s.day_zero_at
group by fps.player_id, fps.team_id, f.competition_id, f.season, fps.provider;

grant select on public.sports_player_period_aggregates to authenticated, service_role;

commit;
