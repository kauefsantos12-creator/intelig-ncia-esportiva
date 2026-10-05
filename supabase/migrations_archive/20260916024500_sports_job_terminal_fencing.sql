-- Parte 4 — terminalização explícita para falhas não recuperáveis do worker.
begin;

create or replace function public.dead_sports_job(
  p_job_id uuid,
  p_worker_token uuid,
  p_error text
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
  set status = 'DEAD',
      lease_token = null,
      lease_expires_at = null,
      last_error = left(coalesce(p_error, 'terminal failure'), 4000),
      completed_at = now(),
      updated_at = now()
  where id = p_job_id
    and status = 'RUNNING'
    and lease_token = p_worker_token
    and lease_expires_at >= now();

  get diagnostics v_count = row_count;
  return v_count = 1;
end;
$$;

revoke all on function public.dead_sports_job(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.dead_sports_job(uuid, uuid, text) to service_role;

commit;
