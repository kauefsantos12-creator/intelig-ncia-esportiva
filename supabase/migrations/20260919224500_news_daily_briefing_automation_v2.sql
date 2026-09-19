-- Noticiário v2: escopo editorial completo + publicação diária automática.
begin;
create or replace function public.publish_sports_daily_briefing(p_date date default ((now() at time zone 'America/Sao_Paulo')::date))
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid; v_summary text; v_facts_through timestamptz;
begin
 insert into public.sports_daily_briefings(briefing_date,status,updated_at) values(p_date,'DRAFT',now())
 on conflict(briefing_date) do update set status='DRAFT',updated_at=now() returning id into v_id;
 delete from public.sports_briefing_items where briefing_id=v_id;
 with eligible as (
  select f.id,f.kickoff_at,f.home_goals,f.away_goals,h.name home_name,a.name away_name,c.name competition_name,fp.payload,fp.generated_at,
   case when c.country_code in ('GB-ENG','DE','FR','IT','ES','BR') and c.division_level in (1,2) then 400
    when c.competition_kind='CONTINENTAL' and c.region in ('EUROPE','SOUTH_AMERICA') then 380
    when c.country_code='AR' and c.division_level=1 then 340
    when c.country_code='US' and lower(c.name) like '%mls%' then 320
    when lower(c.name) like '%saudi%' then 320
    when lower(c.name) like any(array['%fa cup%','%efl cup%','%copa del rey%','%coppa italia%','%coupe de france%','%dfb%pokal%','%copa do brasil%']) then 360
    when lower(c.name) like '%international%' then 300 else null end scope_priority
  from public.sports_fixtures f join public.sports_teams h on h.id=f.home_team_id join public.sports_teams a on a.id=f.away_team_id
  join public.sports_competitions c on c.id=f.competition_id join public.sports_match_fact_packs fp on fp.fixture_id=f.id
  where f.status='FINISHED' and (f.kickoff_at at time zone 'America/Sao_Paulo')::date=p_date
 ), ranked as (select *,row_number() over(order by scope_priority desc,kickoff_at desc,id) rn from eligible where scope_priority is not null)
 insert into public.sports_briefing_items(briefing_id,fixture_id,item_kind,title,body,priority,facts,provenance)
 select v_id,id,'FOOTBALL_MATCH',home_name||' '||home_goals||' × '||away_goals||' '||away_name,
  competition_name||'. '||
  case when coalesce((payload#>>'{statistics,shots_on_target,home}')::int,0)+coalesce((payload#>>'{statistics,shots_on_target,away}')::int,0)>0 then 'Finalizações no alvo: '||coalesce(payload#>>'{statistics,shots_on_target,home}','0')||'–'||coalesce(payload#>>'{statistics,shots_on_target,away}','0')||'. ' else '' end||
  case when coalesce((payload#>>'{statistics,possession,home}')::numeric,0)+coalesce((payload#>>'{statistics,possession,away}')::numeric,0)>0 then 'Posse: '||coalesce(payload#>>'{statistics,possession,home}','0')||'%–'||coalesce(payload#>>'{statistics,possession,away}','0')||'%. ' else '' end||
  case when coalesce((payload#>>'{corners,home}')::int,0)+coalesce((payload#>>'{corners,away}')::int,0)>0 then 'Escanteios: '||coalesce(payload#>>'{corners,home}','0')||'–'||coalesce(payload#>>'{corners,away}','0')||'.' else '' end,
  scope_priority*1000-rn,jsonb_build_object('score',jsonb_build_object('home',home_goals,'away',away_goals),'factPack',payload),
  jsonb_build_array(jsonb_build_object('source','sports_match_fact_packs','fixtureId',id,'generatedAt',generated_at)) from ranked;
 select max(fp.generated_at) into v_facts_through from public.sports_match_fact_packs fp join public.sports_fixtures f on f.id=fp.fixture_id
 where f.status='FINISHED' and (f.kickoff_at at time zone 'America/Sao_Paulo')::date=p_date;
 select string_agg(title||case when nullif(body,'') is not null then '. '||body else '' end,E'\n\n' order by priority desc,created_at) into v_summary
 from (select title,body,priority,created_at from public.sports_briefing_items where briefing_id=v_id and item_kind='FOOTBALL_MATCH' order by priority desc,created_at limit 16)s;
 update public.sports_daily_briefings set status=case when v_summary is null then 'READY' else 'PUBLISHED' end,
 football_summary=case when v_summary is null then null else 'Resenha factual dos jogos prioritários:'||E'\n\n'||v_summary end,
 facts_through=v_facts_through,generated_at=now(),metadata=jsonb_build_object('definitionVersion','daily-briefing-v2','generation','deterministic_fact_pack','timezone','America/Sao_Paulo','scope','editorial_priority'),updated_at=now() where id=v_id;
 return v_id;
end $$;
revoke all on function public.publish_sports_daily_briefing(date) from public,anon,authenticated;
grant execute on function public.publish_sports_daily_briefing(date) to service_role;
do $$ declare r record; begin
 if to_regclass('cron.job') is not null then
  for r in select jobid from cron.job where jobname='sports-daily-briefing-yesterday' loop perform cron.unschedule(r.jobid); end loop;
  perform cron.schedule('sports-daily-briefing-yesterday','55 8 * * *','select public.publish_sports_daily_briefing(((now() at time zone ''America/Sao_Paulo'')::date - 1));');
 end if;
end $$;
select public.publish_sports_daily_briefing(((now() at time zone 'America/Sao_Paulo')::date - 1));
commit;