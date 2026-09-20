begin;
select plan(6);

select ok(
  to_regprocedure('public.enqueue_today_recent_form_backfill(date)') is not null,
  'Today recent-form backfill enqueuer exists'
);

select ok(
  not has_function_privilege('anon','public.enqueue_today_recent_form_backfill(date)','EXECUTE')
  and not has_function_privilege('authenticated','public.enqueue_today_recent_form_backfill(date)','EXECUTE')
  and has_function_privilege('service_role','public.enqueue_today_recent_form_backfill(date)','EXECUTE'),
  'recent-form backfill enqueuer is service-role only'
);

select ok(
  position('FIVE_DOLLAR_RECENT_FORM_LEAGUE' in pg_get_functiondef('public.enqueue_today_recent_form_backfill(date)'::regprocedure)) > 0,
  'enqueuer creates the dedicated lightweight history job'
);

select ok(
  position('get_today_tracked_fixtures' in pg_get_functiondef('public.enqueue_today_recent_form_backfill(date)'::regprocedure)) > 0,
  'enqueuer derives targets from canonical Today agenda'
);

select ok(
  position('interval ''365 days''' in pg_get_functiondef('public.enqueue_today_recent_form_backfill(date)'::regprocedure)) > 0
  and position('< 5' in pg_get_functiondef('public.enqueue_today_recent_form_backfill(date)'::regprocedure)) > 0,
  'enqueuer only targets teams without five stored matches in the operational lookback'
);

select ok(
  exists (
    select 1
    from cron.job
    where jobname='sports-recent-form-history-today'
      and schedule='40 7 * * *'
      and active=true
  ),
  'recent-form history seed is scheduled daily after Today fixture sync'
);

select * from finish();
rollback;
