-- Stage 4 scope reconciliation: fixtures are canonically sourced from 5Dollar,
-- while squad coverage may live on API-Football competition identities.
-- Accept either provider identity, but still only for the same six leagues.
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
      c.api_football_league_id in (39, 61, 71, 78, 135, 140)
      or c.five_dollar_league_id in (
        4160026622, -- England Premier League
        3614399544, -- France Ligue 1
        3118717965, -- Brazil Serie A
        686337048,  -- Germany Bundesliga I
        3405541143, -- Italy Serie A
        4212821298  -- Spain La Liga
      )
    from public.sports_fixtures f
    join public.sports_competitions c on c.id = f.competition_id
    where f.id = p_fixture_id
  ), false);
$$;

revoke all on function public.sports_fixture_in_api_football_scope(uuid) from public, anon, authenticated;
grant execute on function public.sports_fixture_in_api_football_scope(uuid) to service_role;

-- Restore only Stage 4 jobs that were terminalized by the previous scope bug.
-- Preserve their original timing/backoff when still in the future.
update public.sports_jobs j
set status = 'PENDING',
    completed_at = null,
    lease_token = null,
    lease_expires_at = null,
    available_at = greatest(coalesce(j.available_at, now()), now()),
    last_error = 'requeued: corrected dual-provider six-league scope',
    updated_at = now()
where j.job_type in ('API_FOOTBALL_LINK','API_FOOTBALL_FIXTURE_DATA')
  and j.fixture_id is not null
  and j.status = 'DEAD'
  and j.attempts < j.max_attempts
  and j.last_error = 'scope_excluded: Stage 4 detailed enrichment restricted to six Stage 3 squad leagues'
  and public.sports_fixture_is_prospective(j.fixture_id)
  and public.sports_fixture_in_api_football_scope(j.fixture_id);

commit;
