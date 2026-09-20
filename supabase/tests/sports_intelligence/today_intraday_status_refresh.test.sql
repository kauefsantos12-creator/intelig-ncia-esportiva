begin;
select plan(5);

select ok(
  exists (
    select 1
    from cron.job
    where jobname='sports-today-refresh-day'
      and schedule='*/15 9-23 * * *'
      and active=true
  ),
  'Today daytime refresh runs every 15 minutes during the active match window'
);

select ok(
  exists (
    select 1
    from cron.job
    where jobname='sports-today-refresh-late'
      and schedule='*/15 0-2 * * *'
      and active=true
  ),
  'Today late refresh runs every 15 minutes through 23:45 Sao Paulo'
);

select is(
  (select command from cron.job where jobname='sports-today-refresh-day'),
  'select public.kick_sports_daily_sync(0);',
  'daytime refresh reuses the canonical daily sync'
);

select is(
  (select command from cron.job where jobname='sports-today-refresh-late'),
  'select public.kick_sports_daily_sync(0);',
  'late refresh reuses the canonical daily sync'
);

select is(
  (select count(*)::integer from cron.job where jobname in ('sports-today-refresh-day','sports-today-refresh-late')),
  2,
  'intraday Today refresh has exactly two non-overlapping cron windows'
);

select * from finish();
rollback;
