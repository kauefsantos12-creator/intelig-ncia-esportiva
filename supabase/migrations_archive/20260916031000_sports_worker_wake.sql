-- Parte 4 — acordar o worker TypeScript sem versionar segredos.
begin;

create or replace function public.verify_sports_worker_cron_token(p_token text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  if p_token is null or length(p_token) < 32 then
    return false;
  end if;

  select decrypted_secret
  into v_secret
  from vault.decrypted_secrets
  where name = 'sports_worker_cron_secret'
  limit 1;

  if v_secret is null then
    return false;
  end if;

  return extensions.digest(p_token, 'sha256') = extensions.digest(v_secret, 'sha256');
end;
$$;

revoke all on function public.verify_sports_worker_cron_token(text) from public, anon, authenticated;
grant execute on function public.verify_sports_worker_cron_token(text) to service_role;

create or replace function public.kick_sports_job_worker()
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
  if not pg_catalog.pg_try_advisory_xact_lock(pg_catalog.hashtext('kick_sports_job_worker')) then
    return pg_catalog.jsonb_build_object('status','SKIPPED','reason','already_running');
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
    return pg_catalog.jsonb_build_object('status','SKIPPED','reason','missing_worker_secret');
  end if;

  if nullif(v_base_url, '') is null then
    return pg_catalog.jsonb_build_object('status','SKIPPED','reason','missing_worker_base_url');
  end if;

  select net.http_post(
    url := pg_catalog.rtrim(v_base_url, '/') || '/api/sports-jobs',
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

revoke all on function public.kick_sports_job_worker() from public, anon, authenticated;
grant execute on function public.kick_sports_job_worker() to service_role;

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
  end if;
end $$;

commit;
