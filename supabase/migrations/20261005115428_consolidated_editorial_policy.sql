-- Governed editorial v3: explanatory review, 14 publishers, SofaScore-only performance.
begin;

-- Retain the existing service-only entry point without the performance fallback.
-- Match facts and analytics from other providers remain available to their own domains.
create or replace function public.apply_sports_editorial_provider_stats(p_date date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.sports_daily_briefings
  set metadata=metadata||jsonb_build_object(
    'statsPolicy','sofascore_only',
    'statsPrimaryProvider','sofascore',
    'statsSecondaryProvider',null,
    'sofascoreMode','persisted_evidence_only',
    'xgPolicy','omit_when_unavailable',
    'editorialPolicyVersion','editorial-explanatory-v3',
    'editorialAxes',jsonb_build_array('explanatory_review','score_performance_contrast','protagonist_in_context')
  ), editorial_payload=jsonb_set(
    editorial_payload,'{sourcePolicy,statistics}',
    to_jsonb('Somente SofaScore para estatísticas de desempenho do futebol. Dados ausentes são omitidos, sem fallback por outro provedor.'::text),true
  ) #- '{sourcePolicy,statisticsFallback}', updated_at=now()
  where briefing_date=p_date;
  return 0;
end
$$;
revoke all on function public.apply_sports_editorial_provider_stats(date) from public,anon,authenticated;
grant execute on function public.apply_sports_editorial_provider_stats(date) to service_role;

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

  -- Do not equate missing men's first-team data with no official Palmeiras event.
  delete from public.sports_briefing_items i
  where i.briefing_id=v_briefing_id and i.item_kind='NEWS_CONTEXT' and i.title='Palmeiras'
    and jsonb_array_length(coalesce(i.facts#>'{data,yesterdayFixtures}','[]'::jsonb))=0;

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
      and lower(e.source_name)=any(array['kicker','bild sport','marca','as','bbc sport','sky sports','l''équipe','rmc sport','la gazzetta dello sport','corriere dello sport','a bola','record','ge','uol esporte'])
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
          'excerpt',left(body,700),
          'publisherUrl',metadata->>'publisherUrl',
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
      and lower(e.source_name)=any(array['kicker','bild sport','marca','as','bbc sport','sky sports','l''équipe','rmc sport','la gazzetta dello sport','corriere dello sport','a bola','record','ge','uol esporte'])
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
        'sourceName',source_name,
        'sourceExcerpt',left(body,700),
        'publisherUrl',metadata->>'publisherUrl',
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

-- New catalog definition; preserve the terms status and all historical evidence.
update public.source_definitions
set definition_version='editorial-rss-v2',
    metric_definitions=metric_definitions||jsonb_build_object(
      'publisherPolicy','two_approved_publishers_per_country',
      'publishers',jsonb_build_object(
        'DE',jsonb_build_array('kicker','BILD Sport'),
        'ES',jsonb_build_array('Marca','AS'),
        'GB-ENG',jsonb_build_array('BBC Sport','Sky Sports'),
        'FR',jsonb_build_array('L''Équipe','RMC Sport'),
        'IT',jsonb_build_array('La Gazzetta dello Sport','Corriere dello Sport'),
        'PT',jsonb_build_array('A Bola','Record'),
        'BR',jsonb_build_array('ge','UOL Esporte')
      ), 'statisticsPolicy','sofascore_only',
      'editorialPolicyVersion','editorial-explanatory-v3'
    ), notes='14 veículos aprovados. RSS direto ou Google News apenas para descoberta com validação de atribuição e domínio. Manchete e trecho não equivalem à leitura integral. Sem cobertura, redação factual.',
    reviewed_at=now(), next_review_at=now()+interval '90 days'
where source='editorial_rss';

commit;
