-- Resenha v8 — fechamento exclusivamente do dia esportivo anterior.
-- Ingesta contexto jornalístico persistido, outros esportes e remove agenda/transmissões
-- da superfície editorial da Resenha.
begin;

create unique index if not exists sports_editorial_source_evidence_source_event_uidx
  on public.sports_editorial_source_evidence(source_kind,evidence_type,source_event_id);

create or replace function public.apply_previous_day_editorial_context(p_date date)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match_context integer := 0;
  v_other_sports integer := 0;
  v_briefing_id uuid;
  v_other_summary text;
begin
  select id into v_briefing_id
  from public.sports_daily_briefings
  where briefing_date=p_date
  limit 1;

  if v_briefing_id is null then
    return jsonb_build_object('status','SKIPPED','reason','briefing_not_found','date',p_date);
  end if;

  -- A Resenha é retrospectiva: remove qualquer agenda/transmissão futura herdada da v4.
  update public.sports_daily_briefings
  set
    editorial_payload =
      jsonb_set(
        jsonb_set(
          editorial_payload,
          '{sections}',
          coalesce(editorial_payload->'sections','{}'::jsonb)
            - 'todaySchedule'
            - 'broadcastSourceStatus'
            - 'broadcastSourceCheckedAt',
          true
        ),
        '{sourcePolicy,scope}',
        to_jsonb('A Resenha cobre exclusivamente o dia esportivo anterior em America/Sao_Paulo; agenda e onde assistir pertencem à aba Hoje.'::text),
        true
      ),
    metadata = metadata || jsonb_build_object(
      'reviewScope','previous_day_only',
      'scheduleInReview',false,
      'broadcastInReview',false,
      'journalismPolicy','persisted_source_evidence_only'
    ),
    updated_at=now()
  where id=v_briefing_id;

  -- Palmeiras permanece como seção fixa, mas apenas com fatos do dia encerrado.
  update public.sports_briefing_items i
  set
    body = case
      when jsonb_array_length(coalesce(i.facts#>'{data,yesterdayFixtures}','[]'::jsonb))=0
        then 'Não houve jogo do profissional masculino do Palmeiras no catálogo canônico em '||
          to_char(p_date,'DD/MM')||'.'
      else
        'O profissional masculino do Palmeiras teve '||
        jsonb_array_length(coalesce(i.facts#>'{data,yesterdayFixtures}','[]'::jsonb))||
        case
          when jsonb_array_length(coalesce(i.facts#>'{data,yesterdayFixtures}','[]'::jsonb))=1
            then ' partida registrada no dia.'
          else ' partidas registradas no dia.'
        end
    end,
    facts = jsonb_set(
      i.facts,
      '{data}',
      jsonb_build_object(
        'yesterdayFixtures',
        coalesce(i.facts#>'{data,yesterdayFixtures}','[]'::jsonb)
      ),
      true
    )
  where i.briefing_id=v_briefing_id
    and i.item_kind='NEWS_CONTEXT'
    and i.title='Palmeiras';

  -- Até duas fontes jornalísticas por jogo, escolhidas por prioridade/confiança.
  with ranked as (
    select
      e.*,
      row_number() over(
        partition by e.fixture_id
        order by
          coalesce((e.metadata->>'sourcePriority')::integer,0) desc,
          e.confidence desc,
          e.published_at desc nulls last,
          e.id
      ) as rn
    from public.sports_editorial_source_evidence e
    where e.briefing_date=p_date
      and e.source_kind='JOURNALISM'
      and e.evidence_type='MATCH_CONTEXT'
      and e.fixture_id is not null
  ),
  grouped as (
    select
      fixture_id,
      string_agg(
        source_name||': '||left(title,220),
        ' · ' order by rn
      ) as context_line,
      jsonb_agg(
        jsonb_build_object(
          'source',source_name,
          'sourceUrl',source_url,
          'title',title,
          'publishedAt',published_at,
          'fetchedAt',fetched_at,
          'confidence',confidence,
          'tags',coalesce(metadata->'contextTags','[]'::jsonb)
        )
        order by rn
      ) as context_facts,
      jsonb_agg(
        jsonb_build_object(
          'source',source_name,
          'sourceUrl',source_url,
          'publishedAt',published_at,
          'fetchedAt',fetched_at,
          'confidence',confidence,
          'role','journalism_context'
        )
        order by rn
      ) as context_provenance
    from ranked
    where rn<=2
    group by fixture_id
  ),
  updated as (
    update public.sports_briefing_items i
    set
      body = i.body ||
        case
          when nullif(g.context_line,'') is null then ''
          else ' Contexto da imprensa: '||g.context_line||'.'
        end,
      facts = jsonb_set(i.facts,'{journalismContext}',g.context_facts,true),
      provenance = i.provenance || g.context_provenance
    from grouped g
    where i.briefing_id=v_briefing_id
      and i.item_kind='FOOTBALL_MATCH'
      and i.fixture_id=g.fixture_id
      and not exists (
        select 1 from jsonb_array_elements(i.provenance) p
        where p->>'role'='journalism_context'
      )
    returning i.id
  )
  select count(*) into v_match_context from updated;

  -- Recria apenas os destaques de outros esportes vindos de evidência editorial do dia.
  delete from public.sports_briefing_items
  where briefing_id=v_briefing_id
    and item_kind='OTHER_SPORT';

  with deduped as (
    select
      e.*,
      row_number() over(
        partition by lower(regexp_replace(coalesce(e.title,''),'[^[:alnum:]]','','g'))
        order by
          coalesce((e.metadata->>'sourcePriority')::integer,0) desc,
          e.published_at desc nulls last,
          e.confidence desc,
          e.id
      ) as title_rank
    from public.sports_editorial_source_evidence e
    where e.briefing_date=p_date
      and e.source_kind='JOURNALISM'
      and e.evidence_type='OTHER_SPORT'
  ),
  ranked as (
    select
      d.*,
      row_number() over(
        order by
          case coalesce(d.metadata->>'sport','OTHER')
            when 'TENNIS' then 100
            when 'MOTOR' then 90
            when 'BASKET' then 80
            when 'VOLLEY' then 70
            when 'JUDO' then 60
            when 'CYCLING' then 55
            when 'ATHLETICS' then 50
            when 'SWIMMING' then 45
            else 20
          end desc,
          coalesce((d.metadata->>'sourcePriority')::integer,0) desc,
          d.published_at desc nulls last,
          d.id
      ) as editorial_rank
    from deduped d
    where d.title_rank=1
  ),
  inserted as (
    insert into public.sports_briefing_items
      (briefing_id,fixture_id,item_kind,title,body,priority,facts,provenance)
    select
      v_briefing_id,
      null,
      'OTHER_SPORT',
      left(title,240),
      'Fonte editorial: '||source_name||'.',
      250000-editorial_rank,
      jsonb_build_object(
        'section','other_sports',
        'sport',coalesce(metadata->>'sport','OTHER'),
        'sourceTitle',title,
        'sourceUrl',source_url,
        'publishedAt',published_at
      ),
      jsonb_build_array(
        jsonb_build_object(
          'source',source_name,
          'sourceUrl',source_url,
          'publishedAt',published_at,
          'fetchedAt',fetched_at,
          'confidence',confidence,
          'role','other_sport_editorial'
        )
      )
    from ranked
    where editorial_rank<=8
    returning id
  )
  select count(*) into v_other_sports from inserted;

  if v_other_sports>0 then
    v_other_summary :=
      'O fechamento inclui '||v_other_sports||
      case when v_other_sports=1
        then ' destaque de outro esporte com fonte editorial persistida.'
        else ' destaques de outros esportes com fonte editorial persistida.'
      end;
  else
    v_other_summary := null;
  end if;

  update public.sports_daily_briefings
  set
    other_sports_summary=v_other_summary,
    editorial_payload=jsonb_set(
      editorial_payload,
      '{sections,otherSportsCount}',
      to_jsonb(v_other_sports),
      true
    ),
    metadata=metadata||jsonb_build_object(
      'externalEditorialContext',
      case when v_match_context>0 or v_other_sports>0 then 'persisted' else 'none_available' end,
      'journalismMatchItems',v_match_context,
      'otherSportsItems',v_other_sports
    ),
    updated_at=now()
  where id=v_briefing_id;

  return jsonb_build_object(
    'status','APPLIED',
    'date',p_date,
    'matchContextItems',v_match_context,
    'otherSportsItems',v_other_sports
  );
end
$$;

revoke all on function public.apply_previous_day_editorial_context(date)
  from public,anon,authenticated;
grant execute on function public.apply_previous_day_editorial_context(date) to service_role;

create or replace function public.publish_sports_daily_briefing(
  p_date date default (((now() at time zone 'America/Sao_Paulo')::date) - 1)
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  v_id:=public.publish_sports_daily_briefing_base_v4(p_date);
  perform public.apply_sports_editorial_evidence(p_date);
  perform public.apply_sports_editorial_provider_stats(p_date);
  perform public.apply_previous_day_editorial_context(p_date);
  return v_id;
end
$$;

revoke all on function public.publish_sports_daily_briefing(date)
  from public,anon,authenticated;
grant execute on function public.publish_sports_daily_briefing(date) to service_role;

create or replace function public.kick_editorial_source_sync(p_day_offset integer default -1)
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
  if p_day_offset < -2 or p_day_offset > -1 then
    raise exception 'Editorial source sync offset deve ser -1 ou -2';
  end if;

  v_sync_date:=((now() at time zone 'America/Sao_Paulo')::date+p_day_offset);

  if not pg_catalog.pg_try_advisory_xact_lock(
    pg_catalog.hashtext('kick_editorial_source_sync:'||v_sync_date::text)
  ) then
    return jsonb_build_object('status','SKIPPED','reason','already_running','date',v_sync_date);
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
    return jsonb_build_object('status','SKIPPED','reason','missing_worker_secret','date',v_sync_date);
  end if;
  if nullif(v_base_url,'') is null then
    return jsonb_build_object('status','SKIPPED','reason','missing_worker_base_url','date',v_sync_date);
  end if;

  select net.http_post(
    url:=rtrim(v_base_url,'/')||'/api/editorial-source-sync',
    body:=jsonb_build_object('date',v_sync_date::text),
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
    'date',v_sync_date,
    'queued_at',now()
  );
end
$$;

revoke all on function public.kick_editorial_source_sync(integer)
  from public,anon,authenticated;
grant execute on function public.kick_editorial_source_sync(integer) to service_role;

do $$
declare r record;
begin
  if to_regclass('cron.job') is not null then
    for r in select jobid from cron.job where jobname='sports-editorial-source-sync-yesterday' loop
      perform cron.unschedule(r.jobid);
    end loop;

    -- 04:55 America/Sao_Paulo (07:55 UTC), após refresh factual e antes do fechamento 05:05.
    perform cron.schedule(
      'sports-editorial-source-sync-yesterday',
      '55 7 * * *',
      'select public.kick_editorial_source_sync(-1);'
    );
  end if;
end
$$;

insert into public.source_definitions(
  source,definition_version,metric_definitions,configured,notes,provider,
  data_owner_domain,data_steward,license_or_terms,quality_tier,sla_expectation,
  reviewed_at,next_review_at,governance_status
)
values(
  'editorial_rss',
  'editorial-rss-v1',
  jsonb_build_object(
    'content','headlines_and_feed_summaries',
    'matching','canonical_fixture_conservative',
    'scope','previous_day_only',
    'rendering','headline_context_with_explicit_source'
  ),
  true,
  'Fontes jornalísticas e feeds esportivos usados apenas como contexto editorial persistido. Não substituem placar/estatísticas canônicas e não alimentam agenda ou transmissão.',
  'editorial_rss',
  'sources',
  'Repository Maintainer',
  null,
  'SECONDARY_EDITORIAL',
  'Best effort; falhas de uma fonte não bloqueiam o fechamento factual.',
  now(),
  now()+interval '90 days',
  'ACTIVE'
)
on conflict(source) do update set
  definition_version=excluded.definition_version,
  metric_definitions=excluded.metric_definitions,
  configured=excluded.configured,
  notes=excluded.notes,
  provider=excluded.provider,
  quality_tier=excluded.quality_tier,
  sla_expectation=excluded.sla_expectation,
  reviewed_at=excluded.reviewed_at,
  next_review_at=excluded.next_review_at,
  governance_status=excluded.governance_status;

select public.publish_sports_daily_briefing(((now() at time zone 'America/Sao_Paulo')::date - 1));

commit;
