-- Stage 4: detailed API-Football enrichment is restricted to the six leagues
-- whose 116 club squads were loaded and validated in Stage 3.
begin;

create or replace function public.sports_fixture_in_api_football_scope(p_fixture_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select c.api_football_league_id in (39, 61, 71, 78, 135, 140)
    from public.sports_fixtures f
    join public.sports_competitions c on c.id = f.competition_id
    where f.id = p_fixture_id
  ), false);
$$;

revoke all on function public.sports_fixture_in_api_football_scope(uuid) from public, anon, authenticated;
grant execute on function public.sports_fixture_in_api_football_scope(uuid) to service_role;

create or replace function public.guard_api_football_job_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.job_type like 'API_FOOTBALL_%'
     and new.fixture_id is not null
     and not public.sports_fixture_in_api_football_scope(new.fixture_id)
     and new.status in ('PENDING','FAILED','RUNNING') then
    new.status := 'DEAD';
    new.completed_at := coalesce(new.completed_at, pg_catalog.now());
    new.lease_token := null;
    new.lease_expires_at := null;
    new.last_error := 'scope_excluded: Stage 4 detailed enrichment restricted to six Stage 3 squad leagues';
    new.updated_at := pg_catalog.now();
  end if;
  return new;
end;
$$;

revoke all on function public.guard_api_football_job_scope() from public, anon, authenticated;

update public.sports_jobs j
set status = 'DEAD',
    completed_at = coalesce(j.completed_at, now()),
    lease_token = null,
    lease_expires_at = null,
    last_error = 'scope_excluded: Stage 4 detailed enrichment restricted to six Stage 3 squad leagues',
    updated_at = now()
where j.job_type in ('API_FOOTBALL_LINK','API_FOOTBALL_FIXTURE_DATA')
  and j.fixture_id is not null
  and j.status in ('PENDING','FAILED','RUNNING')
  and not public.sports_fixture_in_api_football_scope(j.fixture_id);

commit;
