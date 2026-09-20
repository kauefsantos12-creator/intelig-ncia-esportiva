-- Today intraday refresh — keep fixture status/score current during the active match window.
begin;

do $$
declare
  r record;
begin
  if to_regclass('cron.job') is null then
    return;
  end if;

  for r in
    select jobid
    from cron.job
    where jobname in (
      'sports-today-refresh-day',
      'sports-today-refresh-late'
    )
  loop
    perform cron.unschedule(r.jobid);
  end loop;

  -- 06:00–20:45 America/Sao_Paulo (09:00–23:45 UTC), every 15 minutes.
  perform cron.schedule(
    'sports-today-refresh-day',
    '*/15 9-23 * * *',
    'select public.kick_sports_daily_sync(0);'
  );

  -- 21:00–23:45 America/Sao_Paulo (00:00–02:45 UTC), every 15 minutes.
  perform cron.schedule(
    'sports-today-refresh-late',
    '*/15 0-2 * * *',
    'select public.kick_sports_daily_sync(0);'
  );
end
$$;

commit;
