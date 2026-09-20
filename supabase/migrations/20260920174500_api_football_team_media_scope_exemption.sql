-- Today crest repair: allow media-only API-Football reconciliation outside the
-- six-league detailed enrichment scope without opening lineups/player stats.
begin;

create or replace function public.guard_api_football_job_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.job_type like 'API_FOOTBALL_%'
     and new.job_type <> 'API_FOOTBALL_TEAM_MEDIA_LINK'
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

-- Recover media-only jobs that were terminalized by the previous broad API_FOOTBALL_% guard.
update public.sports_jobs j
set status = 'PENDING',
    completed_at = null,
    lease_token = null,
    lease_expires_at = null,
    available_at = pg_catalog.now(),
    last_error = 'requeued: media-only API-Football scope exemption',
    updated_at = pg_catalog.now()
where j.job_type = 'API_FOOTBALL_TEAM_MEDIA_LINK'
  and j.fixture_id is not null
  and j.status = 'DEAD'
  and j.attempts < j.max_attempts
  and j.last_error = 'scope_excluded: Stage 4 detailed enrichment restricted to six Stage 3 squad leagues';

commit;
