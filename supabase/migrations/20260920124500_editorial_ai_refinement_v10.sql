-- Resenha v10 — refinamento editorial em português via Lovable AI Gateway.
-- Mantém o factual canônico como fonte de verdade e executa a IA depois da publicação.
begin;

create or replace function public.kick_editorial_ai_refinement(p_day_offset integer default -1)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_secret text;
  v_base_url text;
  v_date date;
  v_request_id bigint;
begin
  if p_day_offset < -2 or p_day_offset > -1 then
    raise exception 'AI editorial refinement offset deve ser -1 ou -2';
  end if;

  v_date:=((now() at time zone 'America/Sao_Paulo')::date+p_day_offset);

  if not pg_catalog.pg_try_advisory_xact_lock(
    pg_catalog.hashtext('kick_editorial_ai_refinement:'||v_date::text)
  ) then
    return jsonb_build_object('status','SKIPPED','reason','already_running','date',v_date);
  end if;

  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name='sports_worker_cron_secret'
  limit 1;

  select decrypted_secret into v_base_url
  from vault.decrypted_secrets
  where name='sports_worker_base_url'
  limit 1;

  if nullif(v_secret,'') is null then
    return jsonb_build_object('status','SKIPPED','reason','missing_worker_secret','date',v_date);
  end if;
  if nullif(v_base_url,'') is null then
    return jsonb_build_object('status','SKIPPED','reason','missing_worker_base_url','date',v_date);
  end if;

  select net.http_post(
    url:=rtrim(v_base_url,'/')||'/api/editorial-ai-refine',
    body:=jsonb_build_object('date',v_date::text),
    params:='{}'::jsonb,
    headers:=jsonb_build_object(
      'Authorization','Bearer '||v_secret,
      'Content-Type','application/json'
    ),
    timeout_milliseconds:=120000
  ) into v_request_id;

  return jsonb_build_object(
    'status','QUEUED',
    'request_id',v_request_id,
    'date',v_date,
    'queued_at',now()
  );
end
$$;

revoke all on function public.kick_editorial_ai_refinement(integer)
  from public,anon,authenticated;
grant execute on function public.kick_editorial_ai_refinement(integer) to service_role;

do $$
declare r record;
begin
  if to_regclass('cron.job') is not null then
    for r in select jobid from cron.job where jobname='sports-editorial-ai-refine-yesterday' loop
      perform cron.unschedule(r.jobid);
    end loop;

    -- 05:10 America/Sao_Paulo (08:10 UTC), após o briefing factual das 05:05.
    perform cron.schedule(
      'sports-editorial-ai-refine-yesterday',
      '10 8 * * *',
      'select public.kick_editorial_ai_refinement(-1);'
    );
  end if;
end
$$;

commit;
