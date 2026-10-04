-- Noticiário — geração factual automática da resenha esportiva diária.
-- A publicação é determinística e baseada apenas em fixtures FINISHED + fact packs persistidos.
begin;

create or replace function public.publish_sports_daily_briefing(p_date date default ((now() at time zone 'America/Sao_Paulo')::date))
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_summary text;
  v_facts_through timestamptz;
begin
  insert into public.sports_daily_briefings (briefing_date,status,updated_at)
  values (p_date,'DRAFT',now())
  on conflict (briefing_date) do update set status='DRAFT', updated_at=now()
  returning id into v_id;

  delete from public.sports_briefing_items where briefing_id=v_id;

  with eligible as (
    select f.id,f.kickoff_at,f.home_goals,f.away_goals,
           h.name home_name,a.name away_name,c.name competition_name,
           fp.payload,fp.generated_at
    from public.sports_fixtures f
    join public.sports_teams h on h.id=f.home_team_id
    join public.sports_teams a on a.id=f.away_team_id
    join public.sports_competitions c on c.id=f.competition_id
    join public.sports_match_fact_packs fp on fp.fixture_id=f.id
    where f.status='FINISHED'
      and (f.kickoff_at at time zone 'America/Sao_Paulo')::date=p_date
      and exists (
        select 1 from public.sports_tracking_rules r
        where r.enabled and r.always_track
          and (r.competition_id=f.competition_id or
            (r.competition_id is null
             and (r.country_code is null or r.country_code=c.country_code)
             and (r.region is null or r.region=c.region)
             and (r.competition_kind is null or r.competition_kind=c.competition_kind)
             and (r.division_level is null or r.division_level=c.division_level)))
      )
  ), ranked as (
    select *, row_number() over(order by kickoff_at desc,id) rn from eligible
  )
  insert into public.sports_briefing_items
    (briefing_id,fixture_id,item_kind,title,body,priority,facts,provenance)
  select v_id,id,'FOOTBALL_MATCH',
         home_name||' '||home_goals||' × '||away_goals||' '||away_name,
         competition_name||'. '||
         case
           when coalesce((payload#>>'{statistics,shots_on_target,home}')::int,0)+coalesce((payload#>>'{statistics,shots_on_target,away}')::int,0)>0
           then 'Finalizações no alvo: '||coalesce(payload#>>'{statistics,shots_on_target,home}','0')||'–'||coalesce(payload#>>'{statistics,shots_on_target,away}','0')||'. '
           else '' end ||
         case
           when coalesce((payload#>>'{corners,home}')::int,0)+coalesce((payload#>>'{corners,away}')::int,0)>0
           then 'Escanteios: '||coalesce(payload#>>'{corners,home}','0')||'–'||coalesce(payload#>>'{corners,away}','0')||'.'
           else '' end,
         greatest(1,1000-rn),
         jsonb_build_object('score',jsonb_build_object('home',home_goals,'away',away_goals),'factPack',payload),
         jsonb_build_array(jsonb_build_object('source','sports_match_fact_packs','fixtureId',id,'generatedAt',generated_at))
  from ranked;

  select max(fp.generated_at) into v_facts_through
  from public.sports_match_fact_packs fp
  join public.sports_fixtures f on f.id=fp.fixture_id
  where f.status='FINISHED' and (f.kickoff_at at time zone 'America/Sao_Paulo')::date=p_date;

  select string_agg(title, E'\n' order by priority desc,created_at)
  into v_summary
  from (select title,priority,created_at from public.sports_briefing_items where briefing_id=v_id and item_kind='FOOTBALL_MATCH' order by priority desc,created_at limit 12) s;

  if v_summary is null then
    update public.sports_daily_briefings
       set status='READY',football_summary=null,facts_through=v_facts_through,generated_at=now(),
           metadata=jsonb_build_object('definitionVersion','daily-briefing-v1','reason','no_eligible_finished_fixtures'),
           updated_at=now()
     where id=v_id;
  else
    update public.sports_daily_briefings
       set status='PUBLISHED',
           football_summary='Resumo dos resultados prioritários do dia:'||E'\n\n'||v_summary,
           facts_through=v_facts_through,generated_at=now(),
           metadata=jsonb_build_object('definitionVersion','daily-briefing-v1','generation','deterministic_fact_pack','timezone','America/Sao_Paulo'),
           updated_at=now()
     where id=v_id;
  end if;
  return v_id;
end $$;

revoke all on function public.publish_sports_daily_briefing(date) from public,anon,authenticated;
grant execute on function public.publish_sports_daily_briefing(date) to service_role;

-- Publish today now; later calls are idempotent by briefing_date and rebuild its items.
select public.publish_sports_daily_briefing((now() at time zone 'America/Sao_Paulo')::date);

commit;
