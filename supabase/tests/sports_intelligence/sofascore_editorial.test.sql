begin;
select plan(8);

select ok(
  to_regclass('public.sports_editorial_source_evidence') is not null,
  'editorial source evidence table exists'
);

select ok(
  (select relrowsecurity from pg_class where oid='public.sports_editorial_source_evidence'::regclass),
  'editorial source evidence uses RLS'
);

select ok(
  not has_table_privilege('anon','public.sports_editorial_source_evidence','SELECT')
  and not has_table_privilege('authenticated','public.sports_editorial_source_evidence','SELECT')
  and not has_table_privilege('anon','public.sports_editorial_source_evidence','INSERT')
  and not has_table_privilege('authenticated','public.sports_editorial_source_evidence','INSERT'),
  'browser roles cannot access editorial source evidence'
);

select ok(
  has_table_privilege('service_role','public.sports_editorial_source_evidence','SELECT')
  and has_table_privilege('service_role','public.sports_editorial_source_evidence','INSERT')
  and has_table_privilege('service_role','public.sports_editorial_source_evidence','UPDATE')
  and has_table_privilege('service_role','public.sports_editorial_source_evidence','DELETE'),
  'service role can manage editorial source evidence'
);

select ok(
  to_regprocedure('public.apply_sports_editorial_evidence(date)') is not null
  and to_regprocedure('public.kick_sofascore_editorial_sync(integer)') is not null,
  'SofaScore editorial RPCs exist'
);

select ok(
  not has_function_privilege('anon','public.kick_sofascore_editorial_sync(integer)','EXECUTE')
  and not has_function_privilege('authenticated','public.kick_sofascore_editorial_sync(integer)','EXECUTE')
  and has_function_privilege('service_role','public.kick_sofascore_editorial_sync(integer)','EXECUTE'),
  'SofaScore sync wake is service-role only'
);

select ok(
  not exists(
    select 1 from cron.job
    where jobname='sports-sofascore-editorial-yesterday'
      and active
  ),
  'SofaScore automatic sync stays disabled while the upstream endpoint is challenged'
);

select ok(
  position('apply_sports_editorial_evidence' in lower(pg_get_functiondef('public.publish_sports_daily_briefing(date)'::regprocedure))) > 0,
  'daily briefing applies persisted editorial source evidence'
);

select * from finish();
rollback;
