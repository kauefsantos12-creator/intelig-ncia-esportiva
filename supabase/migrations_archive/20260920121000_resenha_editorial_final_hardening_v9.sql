-- Resenha v9 — fechamento final do contrato retrospectivo.
-- Remove qualquer próximo compromisso remanescente do payload e equilibra
-- outros esportes para evitar um bloco dominado por uma única modalidade.
begin;

create or replace function public.finalize_previous_day_review_contract(p_date date)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_briefing_id uuid;
  v_other_sports integer := 0;
  v_other_summary text;
begin
  select id into v_briefing_id
  from public.sports_daily_briefings
  where briefing_date=p_date
  limit 1;

  if v_briefing_id is null then
    return jsonb_build_object('status','SKIPPED','reason','briefing_not_found','date',p_date);
  end if;

  update public.sports_daily_briefings
  set
    editorial_payload = jsonb_set(
      editorial_payload,
      '{sections,palmeiras}',
      jsonb_build_object(
        'yesterdayFixtures',
        coalesce(editorial_payload#>'{sections,palmeiras,yesterdayFixtures}','[]'::jsonb)
      ),
      true
    ),
    metadata = metadata || jsonb_build_object(
      'futureFixtureInReview',false,
      'otherSportsSelection','balanced_by_sport'
    ),
    updated_at=now()
  where id=v_briefing_id;

  delete from public.sports_briefing_items
  where briefing_id=v_briefing_id
    and item_kind='OTHER_SPORT';

  with deduped as (
    select
      e.*,
      coalesce(e.metadata->>'sport','OTHER') as sport_name,
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
  per_sport as (
    select
      d.*,
      row_number() over(
        partition by d.sport_name
        order by
          coalesce((d.metadata->>'sourcePriority')::integer,0) desc,
          d.published_at desc nulls last,
          d.confidence desc,
          d.id
      ) as sport_rank
    from deduped d
    where d.title_rank=1
  ),
  ranked as (
    select
      p.*,
      row_number() over(
        order by
          case p.sport_name
            when 'TENNIS' then 100
            when 'MOTOR' then 95
            when 'BASKET' then 90
            when 'VOLLEY' then 85
            when 'JUDO' then 80
            when 'CYCLING' then 75
            when 'ATHLETICS' then 70
            when 'SWIMMING' then 65
            else 40
          end desc,
          p.sport_rank,
          coalesce((p.metadata->>'sourcePriority')::integer,0) desc,
          p.published_at desc nulls last
      ) as editorial_rank
    from per_sport p
    where p.sport_rank<=2
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
        'sport',sport_name,
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
    metadata=metadata||jsonb_build_object('otherSportsItems',v_other_sports),
    updated_at=now()
  where id=v_briefing_id;

  return jsonb_build_object(
    'status','APPLIED',
    'date',p_date,
    'otherSportsItems',v_other_sports
  );
end
$$;

revoke all on function public.finalize_previous_day_review_contract(date)
  from public,anon,authenticated;
grant execute on function public.finalize_previous_day_review_contract(date) to service_role;

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
  perform public.finalize_previous_day_review_contract(p_date);
  return v_id;
end
$$;

revoke all on function public.publish_sports_daily_briefing(date)
  from public,anon,authenticated;
grant execute on function public.publish_sports_daily_briefing(date) to service_role;

select public.publish_sports_daily_briefing(((now() at time zone 'America/Sao_Paulo')::date - 1));

commit;
