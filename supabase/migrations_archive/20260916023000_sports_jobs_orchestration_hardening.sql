-- Parte 4 — endurecer as primitivas de jobs antes de ligar um dispatcher.
begin;

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
begin
  if v_key = '' or v_type = '' then
    raise exception 'idempotency_key and job_type are required';
  end if;

  insert into public.sports_jobs(
    idempotency_key, job_type, fixture_id, payload, max_attempts
  ) values (
    v_key, v_type, p_fixture_id, v_payload,
    greatest(1, least(coalesce(p_max_attempts, 5), 20))
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
revoke all on function public.enqueue_sports_job(text, text, uuid, jsonb, integer) from public, anon, authenticated;
grant execute on function public.enqueue_sports_job(text, text, uuid, jsonb, integer) to service_role;

create or replace function public.claim_sports_job(
  p_worker_token uuid,
  p_lease_seconds integer default 120
)
returns public.sports_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.sports_jobs;
  v_lease_seconds integer := greatest(30, least(coalesce(p_lease_seconds, 120), 900));
begin
  if p_worker_token is null then
    raise exception 'worker token is required';
  end if;

  -- Um job que já consumiu todas as tentativas não pode ser reanimado por lease expirado.
  update public.sports_jobs
  set status = 'DEAD',
      lease_token = null,
      lease_expires_at = null,
      completed_at = coalesce(completed_at, now()),
      updated_at = now()
  where attempts >= max_attempts
    and (
      (status in ('PENDING','FAILED') and available_at <= now())
      or (status = 'RUNNING' and lease_expires_at < now())
    );

  select * into v_job
  from public.sports_jobs
  where attempts < max_attempts
    and (
      (status in ('PENDING','FAILED') and available_at <= now())
      or (status = 'RUNNING' and lease_expires_at < now())
    )
  order by available_at asc, created_at asc
  for update skip locked
  limit 1;

  if v_job.id is null then
    return null;
  end if;

  update public.sports_jobs
  set status = 'RUNNING',
      attempts = attempts + 1,
      lease_token = p_worker_token,
      lease_expires_at = now() + make_interval(secs => v_lease_seconds),
      completed_at = null,
      last_error = null,
      updated_at = now()
  where id = v_job.id
  returning * into v_job;

  return v_job;
end;
$$;
revoke all on function public.claim_sports_job(uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_sports_job(uuid, integer) to service_role;

create or replace function public.renew_sports_job_lease(
  p_job_id uuid,
  p_worker_token uuid,
  p_lease_seconds integer default 120
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
  v_lease_seconds integer := greatest(30, least(coalesce(p_lease_seconds, 120), 900));
begin
  update public.sports_jobs
  set lease_expires_at = now() + make_interval(secs => v_lease_seconds),
      updated_at = now()
  where id = p_job_id
    and status = 'RUNNING'
    and lease_token = p_worker_token
    and lease_expires_at >= now();

  get diagnostics v_count = row_count;
  return v_count = 1;
end;
$$;
revoke all on function public.renew_sports_job_lease(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.renew_sports_job_lease(uuid, uuid, integer) to service_role;

create or replace function public.complete_sports_job(
  p_job_id uuid,
  p_worker_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  update public.sports_jobs
  set status = 'SUCCEEDED',
      completed_at = now(),
      lease_token = null,
      lease_expires_at = null,
      last_error = null,
      updated_at = now()
  where id = p_job_id
    and status = 'RUNNING'
    and lease_token = p_worker_token
    and lease_expires_at >= now();

  get diagnostics v_count = row_count;
  return v_count = 1;
end;
$$;
revoke all on function public.complete_sports_job(uuid, uuid) from public, anon, authenticated;
grant execute on function public.complete_sports_job(uuid, uuid) to service_role;

create or replace function public.fail_sports_job(
  p_job_id uuid,
  p_worker_token uuid,
  p_error text,
  p_retry_after_seconds integer default 60
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status text;
begin
  update public.sports_jobs
  set status = case when attempts >= max_attempts then 'DEAD' else 'FAILED' end,
      available_at = case
        when attempts >= max_attempts then available_at
        else now() + make_interval(secs => greatest(5, least(coalesce(p_retry_after_seconds, 60), 3600)))
      end,
      lease_token = null,
      lease_expires_at = null,
      last_error = left(coalesce(p_error, 'unknown failure'), 4000),
      updated_at = now(),
      completed_at = case when attempts >= max_attempts then now() else null end
  where id = p_job_id
    and status = 'RUNNING'
    and lease_token = p_worker_token
    and lease_expires_at >= now()
  returning status into v_status;

  return v_status;
end;
$$;
revoke all on function public.fail_sports_job(uuid, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.fail_sports_job(uuid, uuid, text, integer) to service_role;

commit;
