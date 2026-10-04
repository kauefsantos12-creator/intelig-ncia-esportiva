-- Noticiário v4 — narrativa factual, Palmeiras fixo e agenda editorial filtrada.
begin;

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
  v_count integer := 0;
  v_facts_through timestamptz;
  v_top text;
  v_summary text;
  v_palmeiras_yesterday jsonb := '[]'::jsonb;
  v_palmeiras_next jsonb;
  v_palmeiras jsonb;
  v_palmeiras_body text;
  v_schedule jsonb := '[]'::jsonb;
  v_broadcast_status text := 'NEVER';
  v_broadcast_checked timestamptz;
  v_payload jsonb;
begin
  insert into public.sports_daily_briefings (briefing_date,status,updated_at)
  values (p_date,'DRAFT',now())
  on conflict (briefing_date) do update
    set status='DRAFT', updated_at=now()
  returning id into v_id;

  delete from public.sports_briefing_items where briefing_id=v_id;

  with eligible as (
    select
      f.id,
      f.kickoff_at,
      f.home_goals,
      f.away_goals,
      h.name as home_name,
      a.name as away_name,
      c.name as competition_name,
      fp.payload,
      fp.generated_at,
      ((f.kickoff_at at time zone 'America/Sao_Paulo')::time >= time '21:00') as late_game,
      goals.goal_timeline,
      case
        when lower(h.name)='palmeiras' or lower(a.name)='palmeiras' then 600
        when c.country_code in ('GB-ENG','DE','FR','IT','ES','BR') and c.division_level=1 then 500
        when c.competition_kind='CONTINENTAL' and c.region in ('EUROPE','SOUTH_AMERICA') then 480
        when lower(c.name) like any(array[
          '%fa cup%','%efl cup%','%copa del rey%','%coppa italia%',
          '%coupe de france%','%dfb%pokal%','%copa do brasil%'
        ]) then 460
        when c.country_code in ('GB-ENG','DE','FR','IT','ES','BR') and c.division_level=2 then 420
        when c.country_code='AR' and c.division_level=1 then 380
        when c.country_code='US' and lower(c.name) like '%mls%' then 360
        when lower(c.name) like '%saudi%' then 340
        when lower(c.name) like '%international%' then 320
        else null
      end as scope_priority
    from public.sports_fixtures f
    join public.sports_teams h on h.id=f.home_team_id
    join public.sports_teams a on a.id=f.away_team_id
    join public.sports_competitions c on c.id=f.competition_id
    join public.sports_match_fact_packs fp on fp.fixture_id=f.id
    left join lateral (
      select string_agg(
        coalesce(nullif(e->>'minute',''),'s/min') || ''' ' ||
        case
          when e->>'team'='home' then h.name
          when e->>'team'='away' then a.name
          else 'gol'
        end,
        ', ' order by
          case when coalesce(e->>'minute','') ~ '^\\d+$' then (e->>'minute')::integer else 999 end
      ) as goal_timeline
      from jsonb_array_elements(coalesce(fp.payload->'events','[]'::jsonb)) e
      where lower(coalesce(e->>'type',''))='goal'
    ) goals on true
    where f.status='FINISHED'
      and (f.kickoff_at at time zone 'America/Sao_Paulo')::date=p_date
  ),
  ranked as (
    select *,
      row_number() over(
        order by scope_priority desc,
          abs(coalesce(home_goals,0)-coalesce(away_goals,0)) desc,
          kickoff_at,
          id
      ) as rn
    from eligible
    where scope_priority is not null
  )
  insert into public.sports_briefing_items
    (briefing_id,fixture_id,item_kind,title,body,priority,facts,provenance)
  select
    v_id,
    id,
    'FOOTBALL_MATCH',
    home_name||' '||home_goals||' × '||away_goals||' '||away_name,
    competition_name||'. '||
      case
        when home_goals>away_goals then home_name||' venceu por '||home_goals||' a '||away_goals||'.'
        when away_goals>home_goals then away_name||' venceu por '||away_goals||' a '||home_goals||'.'
        else 'A partida terminou empatada em '||home_goals||' a '||away_goals||'.'
      end ||
      case when nullif(goal_timeline,'') is not null
        then ' Gols registrados: '||goal_timeline||'.'
        else ''
      end,
    scope_priority*1000-rn,
    jsonb_build_object(
      'score',jsonb_build_object('home',home_goals,'away',away_goals),
      'competition',competition_name,
      'kickoffAt',kickoff_at,
      'lateGame',late_game,
      'margin',abs(coalesce(home_goals,0)-coalesce(away_goals,0)),
      'goalTimeline',goal_timeline,
      'factPackSource',coalesce(payload->>'source','unknown')
    ),
    jsonb_build_array(
      jsonb_build_object(
        'source','sports_match_fact_packs',
        'fixtureId',id,
        'generatedAt',generated_at,
        'role','factual'
      )
    )
  from ranked;

  select count(*) into v_count
  from public.sports_briefing_items
  where briefing_id=v_id and item_kind='FOOTBALL_MATCH';

  select max((p->>'generatedAt')::timestamptz)
  into v_facts_through
  from public.sports_briefing_items i
  cross join lateral jsonb_array_elements(i.provenance) p
  where i.briefing_id=v_id
    and i.item_kind='FOOTBALL_MATCH'
    and p->>'generatedAt' is not null;

  select string_agg(title, ', ' order by margin desc, priority desc)
  into v_top
  from (
    select
      title,
      priority,
      coalesce((facts->>'margin')::integer,0) as margin
    from public.sports_briefing_items
    where briefing_id=v_id and item_kind='FOOTBALL_MATCH'
    order by margin desc, priority desc
    limit 3
  ) top_matches;

  if v_count>0 then
    v_summary :=
      'O fechamento de '||to_char(p_date,'DD/MM/YYYY')||' reúne '||v_count||
      case when v_count=1 then ' partida do recorte editorial.' else ' partidas do recorte editorial.' end ||
      case when nullif(v_top,'') is not null
        then ' Entre os placares de maior destaque estão '||v_top||'.'
        else ''
      end ||
      ' A narrativa abaixo usa somente fatos com proveniência registrada; contexto jornalístico externo só entra quando também possuir fonte persistida.';
  end if;

  select coalesce(jsonb_agg(x order by (x->>'kickoffAt')),'[]'::jsonb)
  into v_palmeiras_yesterday
  from (
    select jsonb_build_object(
      'fixtureId',f.id,
      'kickoffAt',f.kickoff_at,
      'status',f.status,
      'competition',c.name,
      'homeTeam',h.name,
      'awayTeam',a.name,
      'homeGoals',f.home_goals,
      'awayGoals',f.away_goals,
      'broadcast',coalesce(b.broadcast,'[]'::jsonb)
    ) as x
    from public.sports_fixtures f
    join public.sports_teams h on h.id=f.home_team_id
    join public.sports_teams a on a.id=f.away_team_id
    join public.sports_competitions c on c.id=f.competition_id
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'broadcaster',e.broadcaster,
          'platform',e.platform,
          'sourceName',e.source_name,
          'sourceUrl',e.source_url,
          'checkedAt',e.checked_at
        )
        order by e.is_primary desc,e.confidence desc
      ) as broadcast
      from public.sports_broadcast_evidence e
      where e.fixture_id=f.id
    ) b on true
    where (lower(h.name)='palmeiras' or lower(a.name)='palmeiras')
      and (f.kickoff_at at time zone 'America/Sao_Paulo')::date=p_date
  ) palmeiras_day;

  select x into v_palmeiras_next
  from (
    select jsonb_build_object(
      'fixtureId',f.id,
      'kickoffAt',f.kickoff_at,
      'status',f.status,
      'competition',c.name,
      'homeTeam',h.name,
      'awayTeam',a.name,
      'homeGoals',f.home_goals,
      'awayGoals',f.away_goals,
      'broadcast',coalesce(b.broadcast,'[]'::jsonb)
    ) as x,
    f.kickoff_at
    from public.sports_fixtures f
    join public.sports_teams h on h.id=f.home_team_id
    join public.sports_teams a on a.id=f.away_team_id
    join public.sports_competitions c on c.id=f.competition_id
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'broadcaster',e.broadcaster,
          'platform',e.platform,
          'sourceName',e.source_name,
          'sourceUrl',e.source_url,
          'checkedAt',e.checked_at
        )
        order by e.is_primary desc,e.confidence desc
      ) as broadcast
      from public.sports_broadcast_evidence e
      where e.fixture_id=f.id
    ) b on true
    where (lower(h.name)='palmeiras' or lower(a.name)='palmeiras')
      and (f.kickoff_at at time zone 'America/Sao_Paulo')::date>p_date
      and f.kickoff_at < (p_date + 8)::timestamp at time zone 'America/Sao_Paulo'
      and f.status<>'FINISHED'
    order by f.kickoff_at
    limit 1
  ) next_match;

  v_palmeiras:=jsonb_build_object(
    'yesterdayFixtures',v_palmeiras_yesterday,
    'nextFixture',v_palmeiras_next
  );

  if jsonb_array_length(v_palmeiras_yesterday)=0 then
    v_palmeiras_body:='Não houve jogo do profissional masculino do Palmeiras no catálogo canônico em '||to_char(p_date,'DD/MM')||'.';
  else
    v_palmeiras_body:='O profissional masculino do Palmeiras teve '||jsonb_array_length(v_palmeiras_yesterday)||
      case when jsonb_array_length(v_palmeiras_yesterday)=1 then ' partida registrada no dia.' else ' partidas registradas no dia.' end;
  end if;

  if v_palmeiras_next is not null then
    v_palmeiras_body:=v_palmeiras_body||
      ' Próximo compromisso registrado: '||
      (v_palmeiras_next->>'homeTeam')||' x '||(v_palmeiras_next->>'awayTeam')||
      ', '||to_char(((v_palmeiras_next->>'kickoffAt')::timestamptz at time zone 'America/Sao_Paulo'),'DD/MM "às" HH24:MI')||
      ', por '||(v_palmeiras_next->>'competition')||'.';
  else
    v_palmeiras_body:=v_palmeiras_body||' O próximo compromisso ainda não está disponível no catálogo dos sete dias seguintes.';
  end if;

  insert into public.sports_briefing_items
    (briefing_id,fixture_id,item_kind,title,body,priority,facts,provenance)
  values (
    v_id,null,'NEWS_CONTEXT','Palmeiras',v_palmeiras_body,700000,
    jsonb_build_object('section','palmeiras','data',v_palmeiras),
    jsonb_build_array(jsonb_build_object('source','sports_fixtures','role','canonical_schedule'))
  );

  select
    case
      when s.last_success_at is not null and (s.last_error is null or s.last_attempt_at<=s.last_success_at) then 'READY'
      when s.last_error is not null then 'ERROR'
      else 'NEVER'
    end,
    greatest(s.last_attempt_at,s.last_success_at)
  into v_broadcast_status,v_broadcast_checked
  from public.sports_sync_state s
  where s.provider='futnatv' and s.domain='broadcasts' and s.season='2026/27'
  limit 1;

  with agenda as (
    select
      f.id,
      f.kickoff_at,
      h.name as home_name,
      a.name as away_name,
      c.name as competition_name,
      case
        when lower(h.name)='palmeiras' or lower(a.name)='palmeiras' then 600
        when c.country_code in ('GB-ENG','DE','FR','IT','ES','BR') and c.division_level=1 then 500
        when c.competition_kind='CONTINENTAL' and c.region in ('EUROPE','SOUTH_AMERICA') then 480
        when lower(c.name) like any(array[
          '%fa cup%','%efl cup%','%copa del rey%','%coppa italia%',
          '%coupe de france%','%dfb%pokal%','%copa do brasil%'
        ]) then 460
        when c.country_code in ('GB-ENG','DE','FR','IT','ES','BR') and c.division_level=2 then 420
        when c.country_code='AR' and c.division_level=1 then 380
        when c.country_code='US' and lower(c.name) like '%mls%' then 360
        when lower(c.name) like '%saudi%' then 340
        when lower(c.name) like '%international%' then 320
        else null
      end as scope_priority,
      coalesce(b.broadcast,'[]'::jsonb) as broadcast
    from public.sports_fixtures f
    join public.sports_teams h on h.id=f.home_team_id
    join public.sports_teams a on a.id=f.away_team_id
    join public.sports_competitions c on c.id=f.competition_id
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'broadcaster',e.broadcaster,
          'platform',e.platform,
          'sourceName',e.source_name,
          'sourceUrl',e.source_url,
          'checkedAt',e.checked_at
        )
        order by e.is_primary desc,e.confidence desc
      ) as broadcast
      from public.sports_broadcast_evidence e
      where e.fixture_id=f.id
    ) b on true
    where (f.kickoff_at at time zone 'America/Sao_Paulo')::date=p_date+1
      and f.status<>'FINISHED'
  ),
  filtered as (
    select * from agenda where scope_priority is not null
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'fixtureId',id,
      'kickoffAt',kickoff_at,
      'competition',competition_name,
      'homeTeam',home_name,
      'awayTeam',away_name,
      'broadcast',broadcast
    )
    order by kickoff_at,scope_priority desc
  ),'[]'::jsonb)
  into v_schedule
  from (select * from filtered order by kickoff_at,scope_priority desc limit 60) schedule_rows;

  v_payload:=jsonb_build_object(
    'schemaVersion','sports-editorial-v2',
    'timezone','America/Sao_Paulo',
    'sections',jsonb_build_object(
      'opening',v_summary,
      'palmeiras',v_palmeiras,
      'highlightsCount',v_count,
      'otherSports',jsonb_build_array(),
      'lateGamesRule','Partidas com início local a partir de 21:00 permanecem no fechamento do dia e são exibidas em "Ontem após 21h".',
      'todaySchedule',v_schedule,
      'broadcastSourceStatus',coalesce(v_broadcast_status,'NEVER'),
      'broadcastSourceCheckedAt',v_broadcast_checked
    ),
    'sourcePolicy',jsonb_build_object(
      'matchFacts','sports_match_fact_packs',
      'matchNarrative','Somente placar, competição, horário e cronologia de gols persistida.',
      'statistics','Não publicar números do fact pack como SofaScore. Estatísticas editoriais exigem proveniência SofaScore persistida.',
      'journalism','Recordes, declarações, repercussão e causalidade exigem URL e horário de consulta persistidos.'
    )
  );

  update public.sports_daily_briefings
  set
    status=case when v_count=0 then 'READY' else 'PUBLISHED' end,
    football_summary=v_summary,
    other_sports_summary=null,
    facts_through=v_facts_through,
    generated_at=now(),
    editorial_payload=v_payload,
    metadata=jsonb_build_object(
      'definitionVersion','daily-briefing-v4',
      'generation','deterministic_editorial_narrative',
      'timezone','America/Sao_Paulo',
      'scope','editorial_priority',
      'factualItems',v_count,
      'statsPolicy','sofascore_provenance_required',
      'externalEditorialContext','pending_source_ingestion'
    ),
    updated_at=now()
  where id=v_id;

  return v_id;
end
$$;

revoke all on function public.publish_sports_daily_briefing(date) from public,anon,authenticated;
grant execute on function public.publish_sports_daily_briefing(date) to service_role;

select public.publish_sports_daily_briefing(((now() at time zone 'America/Sao_Paulo')::date - 1));

commit;
