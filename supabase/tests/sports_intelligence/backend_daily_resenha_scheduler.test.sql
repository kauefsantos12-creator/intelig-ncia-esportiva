begin;
select plan(10);

select ok(
  to_regprocedure('public.prepare_sports_daily_briefing(date)') is not null,
  'prepare briefing RPC exists'
);

select ok(
  to_regprocedure('public.release_sports_daily_briefing(date)') is not null,
  'release briefing RPC exists'
);

select ok(
  not has_function_privilege('anon','public.prepare_sports_daily_briefing(date)','EXECUTE')
  and not has_function_privilege('authenticated','public.prepare_sports_daily_briefing(date)','EXECUTE')
  and has_function_privilege('service_role','public.prepare_sports_daily_briefing(date)','EXECUTE'),
  'prepare briefing is service-role only'
);

select ok(
  not has_function_privilege('anon','public.release_sports_daily_briefing(date)','EXECUTE')
  and not has_function_privilege('authenticated','public.release_sports_daily_briefing(date)','EXECUTE')
  and has_function_privilege('service_role','public.release_sports_daily_briefing(date)','EXECUTE'),
  'release briefing is service-role only'
);

select is(
  (select schedule from cron.job where jobname='sports-editorial-source-sync-yesterday'),
  '50 7 * * *',
  'editorial research starts at 04:50 BRT'
);

select is(
  (select schedule from cron.job where jobname='sports-daily-briefing-prepare-yesterday'),
  '57 7 * * *',
  'briefing is prepared at 04:57 BRT'
);

select is(
  (select schedule from cron.job where jobname='sports-editorial-ai-refine-yesterday'),
  '0 8 * * *',
  'AI refinement starts at 05:00 BRT'
);

select is(
  (select schedule from cron.job where jobname='sports-daily-briefing-release-yesterday'),
  '5 8 * * *',
  'briefing is released at 05:05 BRT'
);

select ok(
  not exists(select 1 from cron.job where jobname='sports-daily-briefing-yesterday'),
  'legacy direct-publish cron is removed'
);

select ok(
  position('FACTUAL_FALLBACK' in pg_get_functiondef('public.release_sports_daily_briefing(date)'::regprocedure)) > 0
  and position('AI_REFINED' in pg_get_functiondef('public.release_sports_daily_briefing(date)'::regprocedure)) > 0,
  '05:05 release has AI-refined and factual-fallback modes'
);

select * from finish();
rollback;
