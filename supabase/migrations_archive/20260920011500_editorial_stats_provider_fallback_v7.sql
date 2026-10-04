-- Resenha v7 — estatísticas editoriais por provedor com fallback robusto.
-- SofaScore permanece opcional; 5Dollar passa a cobrir o conjunto estável já persistido
-- quando não houver evidência SofaScore específica para a fixture.
begin;

create or replace function public.apply_sports_editorial_provider_stats(p_date date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer := 0;
begin
  with candidates as (
    select
      i.id,
      i.fixture_id,
      fp.source_fetched_at,
      fp.payload,
      jsonb_strip_nulls(
        jsonb_build_object(
          'shotsOnTarget', case
            when fp.payload#>>'{statistics,shots_on_target,home}' is not null
             and fp.payload#>>'{statistics,shots_on_target,away}' is not null
            then jsonb_build_object(
              'home',(fp.payload#>>'{statistics,shots_on_target,home}')::numeric,
              'away',(fp.payload#>>'{statistics,shots_on_target,away}')::numeric
            )
          end,
          'possession', case
            when fp.payload#>>'{statistics,possession,home}' is not null
             and fp.payload#>>'{statistics,possession,away}' is not null
            then jsonb_build_object(
              'home',(fp.payload#>>'{statistics,possession,home}')::numeric,
              'away',(fp.payload#>>'{statistics,possession,away}')::numeric
            )
          end,
          'corners', case
            when fp.payload#>>'{corners,home}' is not null
             and fp.payload#>>'{corners,away}' is not null
            then jsonb_build_object(
              'home',(fp.payload#>>'{corners,home}')::numeric,
              'away',(fp.payload#>>'{corners,away}')::numeric
            )
          end
        )
      ) as curated,
      concat_ws(' · ',
        case
          when fp.payload#>>'{statistics,shots_on_target,home}' is not null
           and fp.payload#>>'{statistics,shots_on_target,away}' is not null
          then 'finalizações no alvo '||
            trim(to_char((fp.payload#>>'{statistics,shots_on_target,home}')::numeric,'FM999990.##'))||'–'||
            trim(to_char((fp.payload#>>'{statistics,shots_on_target,away}')::numeric,'FM999990.##'))
        end,
        case
          when fp.payload#>>'{statistics,possession,home}' is not null
           and fp.payload#>>'{statistics,possession,away}' is not null
          then 'posse '||
            trim(to_char((fp.payload#>>'{statistics,possession,home}')::numeric,'FM999990.##'))||'%–'||
            trim(to_char((fp.payload#>>'{statistics,possession,away}')::numeric,'FM999990.##'))||'%'
        end,
        case
          when fp.payload#>>'{corners,home}' is not null
           and fp.payload#>>'{corners,away}' is not null
          then 'escanteios '||
            trim(to_char((fp.payload#>>'{corners,home}')::numeric,'FM999990.##'))||'–'||
            trim(to_char((fp.payload#>>'{corners,away}')::numeric,'FM999990.##'))
        end
      ) as stat_line
    from public.sports_briefing_items i
    join public.sports_daily_briefings b on b.id=i.briefing_id
    join public.sports_match_fact_packs fp on fp.fixture_id=i.fixture_id
    where b.briefing_date=p_date
      and i.item_kind='FOOTBALL_MATCH'
      and not exists (
        select 1
        from jsonb_array_elements(i.provenance) p
        where p->>'source' in ('SofaScore','5DollarFootballAPI')
          and p->>'role'='editorial_statistics'
      )
      and not exists (
        select 1
        from public.sports_editorial_source_evidence e
        where e.fixture_id=i.fixture_id
          and e.briefing_date=p_date
          and e.source_kind='SOFASCORE'
          and e.evidence_type='MATCH_STATS'
      )
  )
  update public.sports_briefing_items i
  set
    body=i.body||
      case when nullif(c.stat_line,'') is null then ''
           else ' 5DollarFootballAPI: '||c.stat_line||'.'
      end,
    facts=jsonb_set(
      i.facts,
      '{editorialStats}',
      jsonb_build_object(
        'source','5DollarFootballAPI',
        'values',coalesce(c.curated,'{}'::jsonb),
        'fetchedAt',c.source_fetched_at
      ),
      true
    ),
    provenance=i.provenance||jsonb_build_array(
      jsonb_build_object(
        'source','5DollarFootballAPI',
        'fixtureId',c.fixture_id,
        'fetchedAt',c.source_fetched_at,
        'role','editorial_statistics'
      )
    )
  from candidates c
  where i.id=c.id
    and c.curated <> '{}'::jsonb;

  get diagnostics v_count = row_count;

  update public.sports_daily_briefings
  set
    metadata=metadata||jsonb_build_object(
      'statsPolicy','provider_attributed',
      'statsPrimaryProvider','five_dollar_football',
      'statsSecondaryProvider','api_football',
      'xgPolicy','optional_only_when_persisted_source_exposes_xg',
      'sofascoreMode','optional_manual_evidence'
    ),
    editorial_payload=jsonb_set(
      jsonb_set(
        editorial_payload,
        '{sourcePolicy,statistics}',
        to_jsonb('Estatísticas editoriais podem vir de 5DollarFootballAPI, API-Football ou SofaScore, sempre com o provedor explicitamente identificado. xG só é exibido quando uma fonte persistida realmente o fornece.'::text),
        true
      ),
      '{sourcePolicy,statisticsFallback}',
      to_jsonb('5DollarFootballAPI é o fallback operacional para finalizações no alvo, posse e escanteios já persistidos no fact pack; ausência de xG não bloqueia a resenha.'::text),
      true
    ),
    updated_at=now()
  where briefing_date=p_date;

  return v_count;
end
$$;

revoke all on function public.apply_sports_editorial_provider_stats(date) from public,anon,authenticated;
grant execute on function public.apply_sports_editorial_provider_stats(date) to service_role;

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

  -- SofaScore, quando houver evidência persistida manualmente/por integração futura,
  -- tem precedência. O fallback 5Dollar só preenche fixtures sem essa evidência.
  perform public.apply_sports_editorial_evidence(p_date);
  perform public.apply_sports_editorial_provider_stats(p_date);
  return v_id;
end
$$;

revoke all on function public.publish_sports_daily_briefing(date) from public,anon,authenticated;
grant execute on function public.publish_sports_daily_briefing(date) to service_role;

-- O endpoint público do SofaScore está retornando challenge/403 para o backend.
-- Mantemos o código e a evidência opcional, mas removemos o cron que geraria ruído diário.
do $$
declare r record;
begin
  if to_regclass('cron.job') is not null then
    for r in
      select jobid from cron.job where jobname='sports-sofascore-editorial-yesterday'
    loop
      perform cron.unschedule(r.jobid);
    end loop;
  end if;
end
$$;

update public.source_definitions
set
  definition_version='five-dollar-v2',
  metric_definitions=jsonb_build_object(
    'provider','five_dollar',
    'editorialMetrics',jsonb_build_object(
      'shots_on_target','statistics.shots_on_target',
      'shots_off_target','statistics.shots_off_target',
      'possession','statistics.possession',
      'corners','corners.home/away',
      'attacks','statistics.attacks',
      'dangerous_attacks','statistics.dangerous_attacks'
    ),
    'editorialPolicy','Provider must be identified in provenance; no SofaScore attribution.',
    'xg','not_provided'
  ),
  notes='Fonte ativa do motor. Para a resenha editorial fornece finalizações no alvo, posse, escanteios, ataques e ataques perigosos quando persistidos; xG não é inferido.',
  reviewed_at=now(),
  next_review_at=now()+interval '90 days'
where source='five_dollar_football';

select public.publish_sports_daily_briefing(((now() at time zone 'America/Sao_Paulo')::date - 1));

commit;
