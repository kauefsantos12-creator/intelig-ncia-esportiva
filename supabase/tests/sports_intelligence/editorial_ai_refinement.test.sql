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
      and schedule='10 8 * * *'
  ),
  'AI refinement runs after the 05:05 briefing'
);

select ok(
  position('/api/editorial-ai-refine' in pg_get_functiondef('public.kick_editorial_ai_refinement(integer)'::regprocedure)) > 0,
  'AI refinement wake calls the protected endpoint'
);

select ok(
  exists(
    select 1 from cron.job
    where jobname='sports-daily-briefing-yesterday'
      and active
      and schedule='5 8 * * *'
  ),
  'factual briefing still publishes before AI refinement'
);

select ok(
  exists(
    select 1 from cron.job
    where jobname='sports-editorial-source-sync-yesterday'
      and active
      and schedule='55 7 * * *'
  ),
  'editorial sources still sync before the factual briefing'
);

select * from finish();
rollback;
