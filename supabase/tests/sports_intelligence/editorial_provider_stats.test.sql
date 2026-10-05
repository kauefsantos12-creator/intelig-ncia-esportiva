begin;
select plan(7);

select ok(
  to_regprocedure('public.apply_sports_editorial_provider_stats(date)') is not null,
  'provider-attributed editorial stats RPC exists'
);

select ok(
  not has_function_privilege('anon','public.apply_sports_editorial_provider_stats(date)','EXECUTE')
  and not has_function_privilege('authenticated','public.apply_sports_editorial_provider_stats(date)','EXECUTE')
  and has_function_privilege('service_role','public.apply_sports_editorial_provider_stats(date)','EXECUTE'),
  'provider stats enrichment is service-role only'
);

select ok(
  position('apply_sports_editorial_provider_stats' in lower(pg_get_functiondef('public.publish_sports_daily_briefing(date)'::regprocedure))) > 0,
  'daily briefing applies the governed statistics policy'
);

select ok(
  not exists(select 1 from cron.job where jobname='sports-sofascore-editorial-yesterday'),
  'blocked SofaScore cron is disabled'
);

select is(
  (select metric_definitions#>>'{editorialMetrics,shots_on_target}' from public.source_definitions where source='five_dollar_football'),
  'statistics.shots_on_target',
  '5Dollar editorial shots-on-target mapping is governed'
);

select is(
  (select metric_definitions->>'xg' from public.source_definitions where source='five_dollar_football'),
  'not_provided',
  '5Dollar does not fabricate xG'
);

select ok(
  position('sofascore_only' in pg_get_functiondef('public.apply_sports_editorial_provider_stats(date)'::regprocedure)) > 0
  and position('sports_match_fact_packs' in pg_get_functiondef('public.apply_sports_editorial_provider_stats(date)'::regprocedure)) = 0,
  'editorial performance statistics use SofaScore without provider fallback'
);

select * from finish();
rollback;
