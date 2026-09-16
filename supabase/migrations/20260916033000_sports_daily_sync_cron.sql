-- Parte 4 — produtor diário 5Dollar para fixtures/jobs canônicos.
begin;

create or replace function public.kick_sports_daily_sync(p_day_offset integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
  v_base_url text;
  v_sync_date date;
  v_request_id bigint;
begin
  if p_day_offset < -7 or p_day_offset > 1 then
    raise exception 'sports daily sync offset fora do intervalo permitido';
  end if;

  v_sync_date := ((pg_catalog.now() at time zone 'America/Sao_Paulo')::date + p_day_offset);

  if not pg_catalog.pg_try_advisory_xact_lock(
    pg_catalog.hashtext('kick_sports_daily_sync:' || v_sync_date::text)
  ) then
    return pg_catalog.jsonb_build_object(
      'status','SKIPPED',
      'reason','already_running',
      'date',v_sync_date
    );
  end if;

  select decrypted_secret
  into v_secret
  from vault.decrypted_secrets
  where name = 'sports_worker_cron_secret'
  limit 1;

  select decrypted_secret
  into v_base_url
  from vault.decrypted_secrets
  where name = 'sports_worker_base_url'
  limit 1;

  if nullif(v_secret, '') is null then
    return pg_catalog.jsonb_build_object('status','SKIPPED','reason','missing_worker_secret','date',v_sync_date);
  end if;

  if nullif(v_base_url, '') is null then
    return pg_catalog.jsonb_build_object('status','SKIPPED','reason','missing_worker_base_url','date',v_sync_date);
  end if;

  select net.http_post(
    url := pg_catalog.rtrim(v_base_url, '/') || '/api/sports-daily-sync',
    body := pg_catalog.jsonb_build_object('date', v_sync_date::text),
    params := '{}'::jsonb,
    headers := pg_catalog.jsonb_build_object(
      'Authorization', 'Bearer ' || v_secret,
      'Content-Type', 'application/json'
    ),
    timeout_milliseconds := 120000
  ) into v_request_id;

  return pg_catalog.jsonb_build_object(
    'status','QUEUED',
    'request_id',v_request_id,
    'date',v_sync_date,
    'queued_at',pg_catalog.now()
  );
end;
$$;

revoke all on function public.kick_sports_daily_sync(integer) from public, anon, authenticated;
grant execute on function public.kick_sports_daily_sync(integer) to service_role;

do $$
declare r record;
begin
  if to_regclass('cron.job') is not null then
    for r in
      select jobid from cron.job
      where jobname in ('sports-daily-sync-yesterday','sports-daily-sync-today')
    loop
      perform cron.unschedule(r.jobid);
    end loop;

    -- 05:20 America/Sao_Paulo (08:20 UTC): fecha o dia anterior depois do Elo.
    perform cron.schedule(
      'sports-daily-sync-yesterday',
      '20 8 * * *',
      'select public.kick_sports_daily_sync(-1);'
    );

    -- 05:40 America/Sao_Paulo (08:40 UTC): carrega a programação do dia.
    perform cron.schedule(
      'sports-daily-sync-today',
      '40 8 * * *',
      'select public.kick_sports_daily_sync(0);'
    );
  end if;
end $$;

commit;
