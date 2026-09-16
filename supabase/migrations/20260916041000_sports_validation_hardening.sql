-- Parte 4 production-validation hardening.
-- Normaliza a identidade 5Dollar, posterga o enriquecimento API-Football para pós-jogo
-- e reativa o worker em um ritmo compatível com o plano Free validado em produção.
begin;

-- A primeira carga de fixtures usou five_dollar:<id>, enquanto times/competições
-- e o runtime atual usam five-dollar:<id>. Falhar explicitamente se já existir
-- uma linha destino evita mesclar identidades silenciosamente.
do $$
begin
  if exists (
    select 1
    from public.sports_fixtures source
    join public.sports_fixtures target
      on target.canonical_key = 'five-dollar:' || source.five_dollar_fixture_id::text
     and target.id <> source.id
    where source.five_dollar_fixture_id is not null
      and source.canonical_key = 'five_dollar:' || source.five_dollar_fixture_id::text
  ) then
    raise exception 'canonical fixture collision while normalizing five_dollar -> five-dollar';
  end if;
end $$;

update public.sports_fixtures
set canonical_key = 'five-dollar:' || five_dollar_fixture_id::text,
    updated_at = now()
where five_dollar_fixture_id is not null
  and canonical_key = 'five_dollar:' || five_dollar_fixture_id::text;

-- As chaves de idempotência derivam da canonical_key da fixture. Normalizar as
-- chaves existentes preserva um único job por finalidade após o próximo re-sync.
do $$
begin
  if exists (
    select 1
    from public.sports_jobs source
    join public.sports_jobs target
      on target.idempotency_key = replace(source.idempotency_key, ':five_dollar:', ':five-dollar:')
     and target.id <> source.id
    where position(':five_dollar:' in source.idempotency_key) > 0
  ) then
    raise exception 'sports job idempotency collision while normalizing five_dollar -> five-dollar';
  end if;
end $$;

update public.sports_jobs
set idempotency_key = replace(idempotency_key, ':five_dollar:', ':five-dollar:'),
    updated_at = now()
where position(':five_dollar:' in idempotency_key) > 0;

-- Fixture-data é pós-jogo. Um job único executado antes do kickoff poderia
-- concluir vazio e nunca ser reaberto por causa da idempotência.
create or replace function public.enqueue_sports_job(
  p_idempotency_key text,
  p_job_type text,
  p_fixture_id uuid default null,
  p_payload jsonb default '{}'::jsonb,
  p_max_attempts integer default 5
)
returns public.sports_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.sports_jobs;
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_type text := btrim(coalesce(p_job_type, ''));
  v_payload jsonb := coalesce(p_payload, '{}'::jsonb);
  v_available_at timestamptz := now();
begin
  if v_key = '' or v_type = '' then
    raise exception 'idempotency_key and job_type are required';
  end if;

  if v_type = 'API_FOOTBALL_FIXTURE_DATA' and p_fixture_id is not null then
    select greatest(now(), f.kickoff_at + interval '3 hours')
      into v_available_at
    from public.sports_fixtures f
    where f.id = p_fixture_id;

    v_available_at := coalesce(v_available_at, now());
  end if;

  insert into public.sports_jobs(
    idempotency_key,
    job_type,
    fixture_id,
    payload,
    max_attempts,
    available_at
  ) values (
    v_key,
    v_type,
    p_fixture_id,
    v_payload,
    greatest(1, least(coalesce(p_max_attempts, 5), 20)),
    v_available_at
  )
  on conflict (idempotency_key) do nothing
  returning * into v_job;

  if v_job.id is null then
    select * into v_job
    from public.sports_jobs
    where idempotency_key = v_key;

    if v_job.id is null then
      raise exception 'idempotent job lookup failed for key %', v_key;
    end if;

    if v_job.job_type is distinct from v_type
      or v_job.fixture_id is distinct from p_fixture_id
      or v_job.payload is distinct from v_payload then
      raise exception 'idempotency key collision for %', v_key;
    end if;
  end if;

  return v_job;
end;
$$;
revoke all on function public.enqueue_sports_job(text,text,uuid,jsonb,integer) from public, anon, authenticated;
grant execute on function public.enqueue_sports_job(text,text,uuid,jsonb,integer) to service_role;

-- Repara os jobs de fixture-data criados durante a validação. Falhas causadas
-- pelo rate limit antigo recebem uma tentativa limpa; todos aguardam pós-jogo.
update public.sports_jobs j
set status = 'PENDING',
    attempts = case
      when lower(coalesce(j.last_error, '')) like '%too many requests%'
        or lower(coalesce(j.last_error, '')) like '%rate limit%'
        or lower(coalesce(j.last_error, '')) like '%requests per minute%'
      then 0
      else j.attempts
    end,
    available_at = greatest(now(), f.kickoff_at + interval '3 hours'),
    lease_token = null,
    lease_expires_at = null,
    completed_at = null,
    last_error = case
      when lower(coalesce(j.last_error, '')) like '%too many requests%'
        or lower(coalesce(j.last_error, '')) like '%rate limit%'
        or lower(coalesce(j.last_error, '')) like '%requests per minute%'
      then null
      else j.last_error
    end,
    updated_at = now()
from public.sports_fixtures f
where j.fixture_id = f.id
  and j.job_type = 'API_FOOTBALL_FIXTURE_DATA'
  and (
    j.status in ('PENDING','FAILED')
    or (j.status = 'RUNNING' and j.lease_expires_at < now())
  );

-- Um lote por minuto reduz o tempo de cada request e mantém folga sob 10 req/min.
-- O timeout maior elimina o falso negativo observado em produção com pg_net.
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
    url := pg_catalog.rtrim(v_base_url, '/') || '/api/sports-jobs',
    body := '{}'::jsonb,
    params := '{}'::jsonb,
    headers := pg_catalog.jsonb_build_object(
      'Authorization', 'Bearer ' || v_secret,
      'Content-Type', 'application/json'
    ),
    timeout_milliseconds := 30000
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

-- Manutenção de status não precisa consumir 24 chamadas/dia da cota Free.
do $$
declare r record;
begin
  if to_regclass('cron.job') is not null then
    for r in select jobid from cron.job where jobname='sports-job-worker-kick' loop
      perform cron.unschedule(r.jobid);
    end loop;
    perform cron.schedule(
      'sports-job-worker-kick',
      '* * * * *',
      'select public.kick_sports_job_worker();'
    );

    for r in select jobid from cron.job where jobname='sports-api-maintenance' loop
      perform cron.unschedule(r.jobid);
    end loop;
    perform cron.schedule(
      'sports-api-maintenance',
      '12 */6 * * *',
      'select public.kick_sports_api_maintenance();'
    );
  end if;
end $$;

commit;
