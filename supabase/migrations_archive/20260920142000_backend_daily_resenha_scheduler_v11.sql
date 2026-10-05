-- Resenha v11 — pipeline diário inteiramente no backend.
-- 04:50 pesquisa/coleta editorial; 04:57 prepara rascunho; 05:00 refina via AI Gateway;
-- 05:05 publica atomicamente para a interface.
begin;

create or replace function public.prepare_sports_daily_briefing(
  p_date date default (((now() at time zone 'America/Sao_Paulo')::date) - 1)
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_id uuid;
begin
  -- Reutiliza o gerador factual/editorial atual e, no mesmo commit, volta o
  -- registro para READY. Como a transação só fica visível no commit, o frontend
  -- nunca enxerga o estado intermediário PUBLISHED desta chamada.
  v_id:=public.publish_sports_daily_briefing(p_date);

  update public.sports_daily_briefings
  set
    status='READY',
    metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
      'backendScheduleVersion','resenha-backend-v1',
      'lifecycle','READY_FOR_AI',
      'preparedAt',now(),
      'publishTargetLocal','05:05',
      'timezone','America/Sao_Paulo'
    ),
    updated_at=now()
  where id=v_id;

  return v_id;
end
$$;

revoke all on function public.prepare_sports_daily_briefing(date)
  from public,anon,authenticated;
grant execute on function public.prepare_sports_daily_briefing(date) to service_role;

create or replace function public.release_sports_daily_briefing(
  p_date date default (((now() at time zone 'America/Sao_Paulo')::date) - 1)
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_id uuid;
  v_status text;
  v_ai_status text;
  v_items integer := 0;
  v_mode text;
begin
  select id,status,metadata->>'aiEditorialStatus'
  into v_id,v_status,v_ai_status
  from public.sports_daily_briefings
  where briefing_date=p_date
  for update;

  if v_id is null then
    return jsonb_build_object(
      'status','SKIPPED',
      'reason','briefing_not_found',
      'date',p_date
    );
  end if;

  select count(*) into v_items
  from public.sports_briefing_items
  where briefing_id=v_id
    and item_kind in ('FOOTBALL_MATCH','OTHER_SPORT','NEWS_CONTEXT');

  if v_items=0 then
    update public.sports_daily_briefings
    set
      status='FAILED',
      metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
        'backendScheduleVersion','resenha-backend-v1',
        'lifecycle','FAILED_AT_RELEASE',
        'releaseFailure','no_editorial_items',
        'releaseAttemptedAt',now()
      ),
      updated_at=now()
    where id=v_id;

    return jsonb_build_object(
      'status','FAILED',
      'reason','no_editorial_items',
      'date',p_date,
      'briefingId',v_id
    );
  end if;

  v_mode:=case when v_ai_status='REFINED' then 'AI_REFINED' else 'FACTUAL_FALLBACK' end;

  update public.sports_daily_briefings
  set
    status='PUBLISHED',
    generated_at=now(),
    metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
      'backendScheduleVersion','resenha-backend-v1',
      'lifecycle','PUBLISHED',
      'releaseMode',v_mode,
      'releasedAt',now(),
      'releaseItemCount',v_items,
      'publishTargetLocal','05:05',
      'timezone','America/Sao_Paulo'
    ),
    updated_at=now()
  where id=v_id;

  return jsonb_build_object(
    'status','PUBLISHED',
    'date',p_date,
    'briefingId',v_id,
    'releaseMode',v_mode,
    'items',v_items
  );
end
$$;

revoke all on function public.release_sports_daily_briefing(date)
  from public,anon,authenticated;
grant execute on function public.release_sports_daily_briefing(date) to service_role;

do $$
declare r record;
begin
  if to_regclass('cron.job') is null then
    return;
  end if;

  -- Remove os agendamentos antigos desta cadeia para evitar publicação dupla.
  for r in
    select jobid
    from cron.job
    where jobname in (
      'sports-editorial-source-sync-yesterday',
      'sports-daily-briefing-yesterday',
      'sports-editorial-ai-refine-yesterday',
      'sports-daily-briefing-prepare-yesterday',
      'sports-daily-briefing-release-yesterday'
    )
  loop
    perform cron.unschedule(r.jobid);
  end loop;

  -- 04:50 BRT: começa a pesquisa/coleta editorial do dia anterior.
  perform cron.schedule(
    'sports-editorial-source-sync-yesterday',
    '50 7 * * *',
    'select public.kick_editorial_source_sync(-1);'
  );

  -- 04:57 BRT: monta a resenha factual/editorial, mas mantém READY (invisível no frontend).
  perform cron.schedule(
    'sports-daily-briefing-prepare-yesterday',
    '57 7 * * *',
    'select public.prepare_sports_daily_briefing(((now() at time zone ''America/Sao_Paulo'')::date - 1));'
  );

  -- 05:00 BRT: reescrita editorial em português via Lovable AI Gateway.
  perform cron.schedule(
    'sports-editorial-ai-refine-yesterday',
    '0 8 * * *',
    'select public.kick_editorial_ai_refinement(-1);'
  );

  -- 05:05 BRT: troca READY -> PUBLISHED e a interface passa a carregar a nova edição.
  perform cron.schedule(
    'sports-daily-briefing-release-yesterday',
    '5 8 * * *',
    'select public.release_sports_daily_briefing(((now() at time zone ''America/Sao_Paulo'')::date - 1));'
  );
end
$$;

commit;
