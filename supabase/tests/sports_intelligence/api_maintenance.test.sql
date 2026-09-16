begin;
select plan(10);

select ok(
  to_regprocedure('public.requeue_unlinked_api_football_jobs()') is not null,
  'inconsistent API-Football link recovery RPC exists'
);

select ok(
  to_regprocedure('public.kick_sports_api_maintenance()') is not null,
  'sports API maintenance kick RPC exists'
);

select ok(
  not has_function_privilege('anon', 'public.requeue_unlinked_api_football_jobs()', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.requeue_unlinked_api_football_jobs()', 'EXECUTE')
  and has_function_privilege('service_role', 'public.requeue_unlinked_api_football_jobs()', 'EXECUTE'),
  'recovery RPC is service-role only'
);

select ok(
  not has_function_privilege('anon', 'public.kick_sports_api_maintenance()', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.kick_sports_api_maintenance()', 'EXECUTE')
  and has_function_privilege('service_role', 'public.kick_sports_api_maintenance()', 'EXECUTE'),
  'maintenance kick is service-role only'
);

select ok(
  position('api_football_fixture_id is null' in lower(pg_get_functiondef('public.requeue_unlinked_api_football_jobs()'::regprocedure))) > 0
  and position('status = ''succeeded''' in lower(pg_get_functiondef('public.requeue_unlinked_api_football_jobs()'::regprocedure))) > 0
  and position('status = ''pending''' in lower(pg_get_functiondef('public.requeue_unlinked_api_football_jobs()'::regprocedure))) > 0,
  'recovery only requeues false-success link jobs without provider id'
);

select ok(
  position('/api/sports-api-maintenance' in pg_get_functiondef('public.kick_sports_api_maintenance()'::regprocedure)) > 0
  and position('net.http_post' in pg_get_functiondef('public.kick_sports_api_maintenance()'::regprocedure)) > 0,
  'maintenance kick uses protected HTTP route through pg_net'
);

select ok(
  exists(select 1 from cron.job where jobname='sports-api-maintenance' and active and schedule='12 * * * *'),
  'API maintenance cron is active hourly'
);

select ok(
  exists(select 1 from cron.job where jobname='sports-job-worker-kick' and active and schedule='*/2 * * * *'),
  'sports worker is re-enabled only with the final API fix migration'
);

select ok(
  exists(
    select 1
    from pg_indexes
    where schemaname='public'
      and tablename='sports_fixture_events'
      and indexname='sports_fixture_events_external_uidx'
      and indexdef not ilike '% where %'
  ),
  'fixture event idempotency index is a non-partial unique arbiter for ON CONFLICT'
);

select ok(
  position('attempts = 0' in lower(pg_get_functiondef('public.requeue_unlinked_api_football_jobs()'::regprocedure))) > 0
  and position('lease_token = null' in lower(pg_get_functiondef('public.requeue_unlinked_api_football_jobs()'::regprocedure))) > 0,
  'recovery clears attempts and lease state before replay'
);

select * from finish();
rollback;
