-- Prevent API-Football maintenance from reviving fixtures that are intentionally
-- outside the provider enrichment scope. The enqueue trigger remains the final
-- defense-in-depth guard, while this function avoids unnecessary queue churn.

create or replace function public.requeue_unlinked_api_football_jobs()
returns integer
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_count integer := 0;
begin
  update public.sports_jobs j
  set status = 'PENDING',
      attempts = 0,
      available_at = now(),
      lease_token = null,
      lease_expires_at = null,
      completed_at = null,
      last_error = 'requeued: succeeded link job without API-Football fixture id',
      updated_at = now()
  where j.job_type = 'API_FOOTBALL_LINK'
    and j.status = 'SUCCEEDED'
    and j.fixture_id is not null
    and public.sports_fixture_in_api_football_scope(j.fixture_id)
    and exists (
      select 1
      from public.sports_fixtures f
      where f.id = j.fixture_id
        and f.api_football_fixture_id is null
    );

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;
