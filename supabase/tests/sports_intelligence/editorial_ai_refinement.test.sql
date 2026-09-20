begin;
select plan(6);

select ok(
  to_regprocedure('public.kick_editorial_ai_refinement(integer)') is not null,
  'AI editorial refinement wake RPC exists'
);

select ok(
  not has_function_privilege('anon','public.kick_editorial_ai_refinement(integer)','EXECUTE')
  and not has_function_privilege('authenticated','public.kick_editorial_ai_refinement(integer)','EXECUTE')
  and has_function_privilege('service_role','public.kick_editorial_ai_refinement(integer)','EXECUTE'),
  'AI editorial refinement wake is service-role only'
);

select ok(
  exists(
    select 1 from cron.job
    where jobname='sports-editorial-ai-refine-yesterday'
      and active
      and schedule='0 8 * * *'
  ),
  'AI refinement runs at 05:00 before the 05:05 release'
);

select ok(
  position('/api/editorial-ai-refine' in pg_get_functiondef('public.kick_editorial_ai_refinement(integer)'::regprocedure)) > 0,
  'AI refinement wake calls the protected endpoint'
);

select ok(
  exists(
    select 1 from cron.job
    where jobname='sports-daily-briefing-prepare-yesterday'
      and active
      and schedule='57 7 * * *'
  ),
  'factual briefing is prepared before AI refinement'
);

select ok(
  exists(
    select 1 from cron.job
    where jobname='sports-editorial-source-sync-yesterday'
      and active
      and schedule='50 7 * * *'
  ),
  'editorial sources sync from 04:50 before preparation'
);

select * from finish();
rollback;
