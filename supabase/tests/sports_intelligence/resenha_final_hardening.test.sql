begin;
select plan(6);

select ok(
  to_regprocedure('public.finalize_previous_day_review_contract(date)') is not null,
  'final previous-day review contract RPC exists'
);

select ok(
  not has_function_privilege('anon','public.finalize_previous_day_review_contract(date)','EXECUTE')
  and not has_function_privilege('authenticated','public.finalize_previous_day_review_contract(date)','EXECUTE')
  and has_function_privilege('service_role','public.finalize_previous_day_review_contract(date)','EXECUTE'),
  'finalizer is service-role only'
);

select ok(
  position('finalize_previous_day_review_contract' in lower(pg_get_functiondef('public.publish_sports_daily_briefing(date)'::regprocedure))) > 0,
  'daily briefing runs final retrospective hardening'
);

select ok(
  position('balanced_by_sport' in pg_get_functiondef('public.finalize_previous_day_review_contract(date)'::regprocedure)) > 0,
  'other sports are balanced by modality'
);

select ok(
  position('nextFixture' in pg_get_functiondef('public.finalize_previous_day_review_contract(date)'::regprocedure)) = 0,
  'finalizer does not recreate next fixture content'
);

select ok(
  position('yesterdayFixtures' in pg_get_functiondef('public.finalize_previous_day_review_contract(date)'::regprocedure)) > 0,
  'Palmeiras payload keeps only retrospective fixtures'
);

select * from finish();
rollback;
