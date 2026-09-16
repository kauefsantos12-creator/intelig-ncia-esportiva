-- Parte 4 validation hardening — keep API-Football inside the user-approved competition scope.
begin;

create or replace function public.sports_fixture_in_api_football_scope(p_fixture_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select
      c.five_dollar_league_id in (
        4160026622, -- England Premier League
        686337048,  -- Germany Bundesliga I
        4212821298, -- Spain La Liga
        3405541143, -- Italy Serie A
        3614399544, -- France Ligue 1
        3118717965  -- Brazil Serie A
      )
      or (
        c.competition_kind = 'CONTINENTAL'
        and c.region in ('EUROPE', 'SOUTH_AMERICA')
      )
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
    new.last_error := 'scope_excluded: API-Football restricted to priority leagues and European/South American continental competitions';
    new.updated_at := pg_catalog.now();
  end if;
  return new;
end;
$$;

revoke all on function public.guard_api_football_job_scope() from public, anon, authenticated;

drop trigger if exists sports_jobs_api_football_scope_guard on public.sports_jobs;
create trigger sports_jobs_api_football_scope_guard
before insert or update of job_type, fixture_id, status
on public.sports_jobs
for each row
execute function public.guard_api_football_job_scope();

-- Stop all queued/retrying API-Football work outside the approved scope immediately.
update public.sports_jobs j
set status = 'DEAD',
    completed_at = coalesce(j.completed_at, now()),
    lease_token = null,
    lease_expires_at = null,
    last_error = 'scope_excluded: API-Football restricted to priority leagues and European/South American continental competitions',
    updated_at = now()
where j.job_type like 'API_FOOTBALL_%'
  and j.fixture_id is not null
  and j.status in ('PENDING','FAILED','RUNNING')
  and not public.sports_fixture_in_api_football_scope(j.fixture_id);

commit;
