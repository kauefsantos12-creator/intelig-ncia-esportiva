-- Noticiário v3 — contrato editorial estruturado, Palmeiras e agenda de hoje.
begin;

alter table public.sports_daily_briefings
  add column if not exists editorial_payload jsonb not null default '{}'::jsonb;

create or replace function public.publish_sports_daily_briefing(p_date date default (((now() at time zone 'America/Sao_Paulo')::date) - 1))
returns uuid language plpgsql security definer set search_path=''
as $$
declare
  v_id uuid; v_summary text; v_other text; v_facts_through timestamptz;
  v_palmeiras jsonb; v_schedule jsonb; v_payload jsonb; v_count int;
begin
 insert into public.sports_daily_briefings(briefing_date,status,updated_at)
 values(p_date,'DRAFT',now())
 on conflict(briefing_date) do update set status='DRAFT',updated_at=now()
 returning id into v_id;
 delete from public.sports_briefing_items where briefing_id=v_id;

 with eligible as (
  select f.id,f.kickoff_at,f.home_goals,f.away_goals,h.name home_name,a.name away_name,c.name competition_name,
         c.country_code,c.region,c.competition_kind,c.division_level,fp.payload,fp.generated_at,
   case
    when lower(h.name)='palmeiras' or lower(a.name)='palmeiras' then 600
    when c.country_code in ('GB-ENG','DE','FR','IT','ES','BR') and c.division_level=1 then 500
    when c.competition_kind='CONTINENTAL' and c.region in ('EUROPE','SOUTH_AMERICA') then 480
    when lower(c.name) like any(array['%fa cup%','%efl cup%','%copa del rey%','%coppa italia%','%coupe de france%','%dfb%pokal%','%copa do brasil%']) then 460
    when c.country_code in ('GB-ENG','DE','FR','IT','ES','BR') and c.division_level=2 then 420
    when c.country_code='AR' and c.division_level=1 then 380
    when c.country_code='US' and lower(c.name) like '%mls%' then 360
    when lower(c.name) like '%saudi%' then 340
    when lower(c.name) like '%international%' then 320 else null end scope_priority
  from public.sports_fixtures f
  join public.sports_teams h on h.id=f.home_team_id
  join public.sports_teams a on a.id=f.away_team_id
  join public.sports_competitions c on c.id=f.competition_id
  join public.sports_match_fact_packs fp on fp.fixture_id=f.id
  where f.status='FINISHED' and (f.kickoff_at at time zone 'America/Sao_Paulo')::date=p_date
 ), ranked as (
  select *,row_number() over(order by scope_priority desc,abs(coalesce(home_goals,0)-coalesce(away_goals,0)) desc,kickoff_at,id) rn
  from eligible where scope_priority is not null
 )
 insert into public.sports_briefing_items(briefing_id,fixture_id,item_kind,title,body,priority,facts,provenance)
 select v_id,id,'FOOTBALL_MATCH',home_name||' '||home_goals||' × '||away_goals||' '||away_name,
   competition_name||'. '||
   case when coalesce((payload#>>'{statistics,shots_on_target,home}')::int,0)+coalesce((payload#>>'{statistics,shots_on_target,away}')::int,0)>0
     then 'Finalizações no alvo: '||coalesce(payload#>>'{statistics,shots_on_target,home}','0')||'–'||coalesce(payload#>>'{statistics,shots_on_target,away}','0')||'. ' else '' end||
   case when coalesce((payload#>>'{statistics,possession,home}')::numeric,0)+coalesce((payload#>>'{statistics,possession,away}')::numeric,0)>0
     then 'Posse: '||coalesce(payload#>>'{statistics,possession,home}','0')||'%–'||coalesce(payload#>>'{statistics,possession,away}','0')||'%. ' else '' end||
   case when coalesce((payload#>>'{corners,home}')::int,0)+coalesce((payload#>>'{corners,away}')::int,0)>0
     then 'Escanteios: '||coalesce(payload#>>'{corners,home}','0')||'–'||coalesce(payload#>>'{corners,away}','0')||'.' else '' end,
   scope_priority*1000-rn,
   jsonb_build_object('score',jsonb_build_object('home',home_goals,'away',away_goals),'competition',competition_name,'kickoffAt',kickoff_at,'factPack',payload),
   jsonb_build_array(jsonb_build_object('source','sports_match_fact_packs','fixtureId',id,'generatedAt',generated_at,'role','factual'))
 from ranked;

 select count(*) into v_count from public.sports_briefing_items where briefing_id=v_id and item_kind='FOOTBALL_MATCH';

 select max((x->>'generatedAt')::timestamptz) into v_facts_through
 from public.sports_briefing_items i cross join lateral jsonb_array_elements(i.provenance) x
 where i.briefing_id=v_id and i.item_kind='FOOTBALL_MATCH' and x->>'generatedAt' is not null;

 select string_agg(title||case when nullif(body,'') is not null then '. '||body else '' end,E'\n\n' order by priority desc,created_at)
 into v_summary from (
   select title,body,priority,created_at from public.sports_briefing_items
   where briefing_id=v_id and item_kind='FOOTBALL_MATCH' order by priority desc,created_at limit 8
 ) s;

 select coalesce(jsonb_agg(x order by (x->>'kickoffAt')),'[]'::jsonb) into v_palmeiras from (
   select jsonb_build_object('fixtureId',f.id,'kickoffAt',f.kickoff_at,'status',f.status,'competition',c.name,
     'homeTeam',h.name,'awayTeam',a.name,'homeGoals',f.home_goals,'awayGoals',f.away_goals) x
   from public.sports_fixtures f join public.sports_teams h on h.id=f.home_team_id join public.sports_teams a on a.id=f.away_team_id
   join public.sports_competitions c on c.id=f.competition_id
   where (lower(h.name)='palmeiras' or lower(a.name)='palmeiras')
     and (f.kickoff_at at time zone 'America/Sao_Paulo')::date between p_date and p_date+2
 ) q;

 select coalesce(jsonb_agg(x order by (x->>'kickoffAt')),'[]'::jsonb) into v_schedule from (
   select jsonb_build_object('fixtureId',f.id,'kickoffAt',f.kickoff_at,'competition',c.name,'homeTeam',h.name,'awayTeam',a.name,
     'broadcast',coalesce(b.broadcast,'[]'::jsonb)) x
   from public.sports_fixtures f join public.sports_teams h on h.id=f.home_team_id join public.sports_teams a on a.id=f.away_team_id
   join public.sports_competitions c on c.id=f.competition_id
   left join lateral (
     select jsonb_agg(jsonb_build_object('broadcaster',e.broadcaster,'platform',e.platform,'sourceName',e.source_name,'sourceUrl',e.source_url,'checkedAt',e.checked_at) order by e.is_primary desc,e.confidence desc) broadcast
     from public.sports_broadcast_evidence e where e.fixture_id=f.id
   ) b on true
   where (f.kickoff_at at time zone 'America/Sao_Paulo')::date=p_date+1 and f.status<>'FINISHED'
   order by f.kickoff_at limit 60
 ) q;

 v_payload:=jsonb_build_object(
   'schemaVersion','sports-editorial-v1','timezone','America/Sao_Paulo',
   'sections',jsonb_build_object(
     'opening',case when v_summary is null then null else 'O fechamento reúne os acontecimentos prioritários com fatos persistidos no motor esportivo. A profundidade editorial adicional só é publicada quando existe proveniência registrada.' end,
     'palmeiras',v_palmeiras,'highlightsCount',v_count,'otherSports',jsonb_build_array(),'lateGamesRule','kickoff >= 21:00 entra no fechamento seguinte',
     'todaySchedule',v_schedule),
   'sourcePolicy',jsonb_build_object('matchFacts','sports_match_fact_packs','statistics','Somente estatísticas persistidas com proveniência; SofaScore quando essa fonte estiver registrada','journalism','Somente conteúdo externo previamente ingerido com URL e horário de consulta')
 );

 update public.sports_daily_briefings set
   status=case when v_summary is null then 'READY' else 'PUBLISHED' end,
   football_summary=case when v_summary is null then null else 'Resenha de '||to_char(p_date,'DD/MM/YYYY')||E'\n\n'||v_summary end,
   other_sports_summary=v_other,facts_through=v_facts_through,generated_at=now(),editorial_payload=v_payload,
   metadata=jsonb_build_object('definitionVersion','daily-briefing-v3','generation','deterministic_editorial_scaffold','timezone','America/Sao_Paulo','scope','editorial_priority','factualItems',v_count),
   updated_at=now() where id=v_id;
 return v_id;
end $$;

revoke all on function public.publish_sports_daily_briefing(date) from public,anon,authenticated;
grant execute on function public.publish_sports_daily_briefing(date) to service_role;

do $$ declare r record; begin
 if to_regclass('cron.job') is not null then
  for r in select jobid from cron.job where jobname='sports-daily-briefing-yesterday' loop perform cron.unschedule(r.jobid); end loop;
  perform cron.schedule('sports-daily-briefing-yesterday','5 8 * * *','select public.publish_sports_daily_briefing(((now() at time zone ''America/Sao_Paulo'')::date - 1));');
 end if;
end $$;
select public.publish_sports_daily_briefing(((now() at time zone 'America/Sao_Paulo')::date - 1));
commit;
