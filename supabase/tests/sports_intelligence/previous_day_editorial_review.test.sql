begin;
select plan(9);

select ok(
  to_regprocedure('public.apply_previous_day_editorial_context(date)') is not null,
  'previous-day editorial context RPC exists'
);

select ok(
  to_regprocedure('public.kick_editorial_source_sync(integer)') is not null,
  'editorial source sync wake RPC exists'
);

select ok(
  not has_function_privilege('anon','public.apply_previous_day_editorial_context(date)','EXECUTE')
  and not has_function_privilege('authenticated','public.apply_previous_day_editorial_context(date)','EXECUTE')
  and has_function_privilege('service_role','public.apply_previous_day_editorial_context(date)','EXECUTE'),
  'editorial context apply is service-role only'
);

select ok(
  not has_function_privilege('anon','public.kick_editorial_source_sync(integer)','EXECUTE')
  and not has_function_privilege('authenticated','public.kick_editorial_source_sync(integer)','EXECUTE')
  and has_function_privilege('service_role','public.kick_editorial_source_sync(integer)','EXECUTE'),
  'editorial source wake is service-role only'
);

select ok(
  exists(
    select 1 from cron.job
    where jobname='sports-editorial-source-sync-yesterday'
      and active
      and schedule='50 7 * * *'
  ),
  'editorial sources start at 04:50 before the backend briefing pipeline'
);

select ok(
  position('apply_previous_day_editorial_context' in lower(pg_get_functiondef('public.publish_sports_daily_briefing(date)'::regprocedure))) > 0,
  'daily briefing applies previous-day editorial context'
);

select is(
  (select configured from public.source_definitions where source='editorial_rss'),
  true,
  'editorial RSS source is configured'
);

select is(
  (select governance_status from public.source_definitions where source='editorial_rss'),
  'ACTIVE',
  'editorial RSS source is governed as active'
);

select ok(
  exists(
    select 1
    from pg_indexes
    where schemaname='public'
      and tablename='sports_editorial_source_evidence'
      and indexname='sports_editorial_source_evidence_source_event_uidx'
  ),
  'editorial source event uniqueness is enforced'
);

select * from finish();
rollback;
