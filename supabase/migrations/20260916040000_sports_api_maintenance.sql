-- Parte 4 final — manutenção das APIs, recuperação de jobs inconsistentes e correção do upsert de eventos.
begin;

-- O upsert do runtime usa ON CONFLICT (fixture_id, provider, external_event_id).
-- O índice anterior era parcial e, por isso, não podia arbitrar esse ON CONFLICT.
drop index if exists public.sports_fixture_events_external_uidx;
create unique index sports_fixture_events_external_uidx
  on public.sports_fixture_events(fixture_id, provider, external_event_id);

create or replace function public.requeue_unlinked_api_football_jobs()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer := 0;
begin
  update public.sports_jobs j
  set status = 'PENDING',
      attempts = 0,
      available_at = now(),
      lease_token = null,
      lease_expires_at = null,
      completed_at = null,
      last_error = 'requeued: succeeded link job without API-Football fixture id',
      updated_at = now()
  where j.job_type = 'API_FOOTBALL_LINK'
    and j.status = 'SUCCEEDED'
    and j.fixture_id is not null
    and exists (
      select 1
      from public.sports_fixtures f
      where f.id = j.fixture_id
        and f.api_football_fixture_id is null
    );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.requeue_unlinked_api_football_jobs() from public, anon, authenticated;
grant execute on function public.requeue_unlinked_api_football_jobs() to service_role;

create or replace function public.kick_sports_api_maintenance()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
  v_base_url text;
  v_request_id bigint;
begin
  if not pg_catalog.pg_try_advisory_xact_lock(pg_catalog.hashtext('kick_sports_api_maintenance')) then
    return pg_catalog.jsonb_build_object('status','SKIPPED','reason','already_running');
  end if;

  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'sports_worker_cron_secret'
  limit 1;

  select decrypted_secret into v_base_url
  from vault.decrypted_secrets
  where name = 'sports_worker_base_url'
  limit 1;

  if nullif(v_secret, '') is null then
    return pg_catalog.jsonb_build_object('status','SKIPPED','reason','missing_worker_secret');
  end if;
  if nullif(v_base_url, '') is null then
    return pg_catalog.jsonb_build_object('status','SKIPPED','reason','missing_worker_base_url');
  end if;

  select net.http_post(
    url := pg_catalog.rtrim(v_base_url, '/') || '/api/sports-api-maintenance',
    body := '{}'::jsonb,
    params := '{}'::jsonb,
    headers := pg_catalog.jsonb_build_object(
      'Authorization', 'Bearer ' || v_secret,
      'Content-Type', 'application/json'
    ),
    timeout_milliseconds := 15000
  ) into v_request_id;

  return pg_catalog.jsonb_build_object(
    'status','QUEUED',
    'request_id',v_request_id,
    'queued_at',pg_catalog.now()
  );
end;
$$;
revoke all on function public.kick_sports_api_maintenance() from public, anon, authenticated;
grant execute on function public.kick_sports_api_maintenance() to service_role;

-- Corrige imediatamente os falsos SUCCEEDED produzidos pelo bug null -> 0.
select public.requeue_unlinked_api_football_jobs();

-- O worker só volta a ser ativado quando esta migration — que acompanha o fix de código — for aplicada.
do $$
declare r record;
begin
  if to_regclass('cron.job') is not null then
    for r in select jobid from cron.job where jobname='sports-job-worker-kick' loop
      perform cron.unschedule(r.jobid);
    end loop;
    perform cron.schedule(
      'sports-job-worker-kick',
      '*/2 * * * *',
      'select public.kick_sports_job_worker();'
    );

    for r in select jobid from cron.job where jobname='sports-api-maintenance' loop
      perform cron.unschedule(r.jobid);
    end loop;
    perform cron.schedule(
      'sports-api-maintenance',
      '12 * * * *',
      'select public.kick_sports_api_maintenance();'
    );
  end if;
end $$;

commit;
