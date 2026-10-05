-- Keep broadcast ingestion inside the existing leased sports_jobs worker.
-- A fresh idempotency key is generated per UTC hour bucket, while cron fires
-- every two hours. The worker itself remains responsible for retries/fencing.

create or replace function public.enqueue_sports_broadcast_sync()
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_sync_date date := (now() at time zone 'America/Sao_Paulo')::date;
  v_bucket text := to_char(date_trunc('hour', now() at time zone 'UTC'), 'YYYYMMDDHH24');
  v_job public.sports_jobs;
begin
  select * into v_job
  from public.enqueue_sports_job(
    'broadcast:futnatv:' || v_sync_date::text || ':' || v_bucket,
    'BROADCAST_SYNC',
    null,
    jsonb_build_object('date', v_sync_date::text),
    5
  );

  return jsonb_build_object(
    'status', v_job.status,
    'job_id', v_job.id,
    'date', v_sync_date,
    'available_at', v_job.available_at
  );
end;
$function$;

revoke all on function public.enqueue_sports_broadcast_sync() from public;
grant execute on function public.enqueue_sports_broadcast_sync() to service_role;

do $block$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id
  from cron.job
  where jobname = 'sports-broadcast-sync-today'
  limit 1;

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;
end;
$block$;

select cron.schedule(
  'sports-broadcast-sync-today',
  '17 */2 * * *',
  'select public.enqueue_sports_broadcast_sync();'
);
