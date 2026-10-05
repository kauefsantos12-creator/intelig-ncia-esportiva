begin;
select plan(8);

insert into public.sports_daily_briefings(briefing_date,status)
values ('2099-10-04','READY');

insert into public.sports_briefing_items(briefing_id,item_kind,title,body,facts)
select id,'FOOTBALL_MATCH','Clube A 1 × 0 Clube B','Clube A venceu por 1 a 0.','{}'::jsonb
from public.sports_daily_briefings where briefing_date='2099-10-04';

do $$ begin perform public.apply_sports_editorial_provider_stats('2099-10-04'); end $$;
select is(
  (select metadata->>'statsPolicy' from public.sports_daily_briefings where briefing_date='2099-10-04'),
  'sofascore_only','briefing declares SofaScore-only performance statistics'
);
select is(
  (select body from public.sports_briefing_items i join public.sports_daily_briefings b on b.id=i.briefing_id
   where b.briefing_date='2099-10-04' and i.item_kind='FOOTBALL_MATCH'),
  'Clube A venceu por 1 a 0.','missing SofaScore evidence leaves the factual body unchanged'
);
select ok(
  not exists(select 1 from public.sports_briefing_items i join public.sports_daily_briefings b on b.id=i.briefing_id
    where b.briefing_date='2099-10-04' and i.facts ? 'editorialStats'),
  'absence of performance evidence does not manufacture metrics'
);

insert into public.sports_editorial_source_evidence
  (briefing_date,source_kind,source_name,source_url,source_event_id,evidence_type,title,body,fetched_at,confidence)
values
  ('2099-10-04','JOURNALISM','ge','https://ge.globo.com/tenis/exemplo','policy-v3-approved','OTHER_SPORT','Tenista vence final','Vitória confirmada na final.',now(),0.9),
  ('2099-10-04','JOURNALISM','Unknown paper','https://unapproved.test/exemplo','policy-v3-rejected','OTHER_SPORT','Outra final','Texto fora da seleção.',now(),0.9);
insert into public.sports_briefing_items(briefing_id,item_kind,title,body,facts)
select id,'NEWS_CONTEXT','Palmeiras','Nota vazia.','{"data":{"yesterdayFixtures":[]}}'::jsonb
from public.sports_daily_briefings where briefing_date='2099-10-04';

do $$ begin perform public.apply_previous_day_editorial_context('2099-10-04'); end $$;
select is(
  (select count(*)::integer from public.sports_briefing_items i join public.sports_daily_briefings b on b.id=i.briefing_id
    where b.briefing_date='2099-10-04' and i.item_kind='OTHER_SPORT'),
  1,'only an approved publisher contributes other-sport evidence'
);
select is(
  (select facts->>'sourceName' from public.sports_briefing_items i join public.sports_daily_briefings b on b.id=i.briefing_id
    where b.briefing_date='2099-10-04' and i.item_kind='OTHER_SPORT'),
  'ge','publisher attribution is available to the refinement input'
);
select is(
  (select facts->>'sourceExcerpt' from public.sports_briefing_items i join public.sports_daily_briefings b on b.id=i.briefing_id
    where b.briefing_date='2099-10-04' and i.item_kind='OTHER_SPORT'),
  'Vitória confirmada na final.','persisted RSS excerpt is passed without inventing article coverage'
);
select ok(
  not exists(select 1 from public.sports_briefing_items i join public.sports_daily_briefings b on b.id=i.briefing_id
    where b.briefing_date='2099-10-04' and i.title='Palmeiras'),
  'missing Palmeiras event does not produce an unsupported no-game section'
);
select is(
  (select sum(jsonb_array_length(p.value))::integer
   from public.source_definitions d cross join lateral jsonb_each(d.metric_definitions->'publishers') p
   where d.source='editorial_rss'),
  14,'governed editorial catalog contains the fourteen selected publishers'
);

select * from finish();
rollback;
