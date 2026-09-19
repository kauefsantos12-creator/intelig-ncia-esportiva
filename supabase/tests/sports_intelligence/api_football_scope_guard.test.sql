begin;
select plan(7);

insert into public.sports_teams(canonical_key,name,five_dollar_team_id)
values
  ('test-scope-home','Scope Home',990000001),
  ('test-scope-away','Scope Away',990000002);

-- Premier League (API-Football 39) is seeded by the canonical migrations.
-- Do not insert a duplicate because api_football_league_id is unique.
insert into public.sports_competitions(canonical_key,name,competition_kind,region,season,five_dollar_league_id,api_football_league_id)
values
  ('test-scope-continental','UEFA Test Continental','CONTINENTAL','EUROPE','2026/27',990000101,990101),
  ('test-scope-excluded','Switzerland Test League','LEAGUE','EUROPE','2026/27',990000102,990102);

insert into public.sports_fixtures(
  canonical_key,primary_provider,primary_fixture_id,five_dollar_fixture_id,competition_id,kickoff_at,status,home_team_id,away_team_id
)
select 'test-scope-epl-fixture','five_dollar','990001001',990001001,c.id,now(),'SCHEDULED',h.id,a.id
from public.sports_competitions c
cross join lateral (select id from public.sports_teams where canonical_key='test-scope-home') h
cross join lateral (select id from public.sports_teams where canonical_key='test-scope-away') a
where c.api_football_league_id=39;

insert into public.sports_fixtures(
  canonical_key,primary_provider,primary_fixture_id,five_dollar_fixture_id,competition_id,kickoff_at,status,home_team_id,away_team_id
)
select 'test-scope-cont-fixture','five_dollar','990001002',990001002,c.id,now(),'SCHEDULED',h.id,a.id
from public.sports_competitions c
cross join lateral (select id from public.sports_teams where canonical_key='test-scope-home') h
cross join lateral (select id from public.sports_teams where canonical_key='test-scope-away') a
where c.canonical_key='test-scope-continental';

insert into public.sports_fixtures(
  canonical_key,primary_provider,primary_fixture_id,five_dollar_fixture_id,competition_id,kickoff_at,status,home_team_id,away_team_id
)
select 'test-scope-excluded-fixture','five_dollar','990001003',990001003,c.id,now(),'SCHEDULED',h.id,a.id
from public.sports_competitions c
cross join lateral (select id from public.sports_teams where canonical_key='test-scope-home') h
cross join lateral (select id from public.sports_teams where canonical_key='test-scope-away') a
where c.canonical_key='test-scope-excluded';

select ok(to_regprocedure('public.sports_fixture_in_api_football_scope(uuid)') is not null, 'scope RPC exists');
select is(public.sports_fixture_in_api_football_scope((select id from public.sports_fixtures where canonical_key='test-scope-epl-fixture')), true, 'Premier League is in API-Football scope');
select is(public.sports_fixture_in_api_football_scope((select id from public.sports_fixtures where canonical_key='test-scope-cont-fixture')), false, 'continental competition is excluded from Stage 4 detailed enrichment');
select is(public.sports_fixture_in_api_football_scope((select id from public.sports_fixtures where canonical_key='test-scope-excluded-fixture')), false, 'non-priority domestic league is excluded');

select public.enqueue_sports_job('test:scope:epl','API_FOOTBALL_LINK',(select id from public.sports_fixtures where canonical_key='test-scope-epl-fixture'),'{}'::jsonb,5);
select public.enqueue_sports_job('test:scope:excluded','API_FOOTBALL_LINK',(select id from public.sports_fixtures where canonical_key='test-scope-excluded-fixture'),'{}'::jsonb,5);

select is((select status from public.sports_jobs where idempotency_key='test:scope:epl'),'PENDING','in-scope API-Football job remains claimable');
select is((select status from public.sports_jobs where idempotency_key='test:scope:excluded'),'DEAD','out-of-scope API-Football job is terminal before any provider call');
select ok(
  coalesce((select last_error from public.sports_jobs where idempotency_key='test:scope:excluded'), '') like 'scope_excluded:%',
  'excluded job records scope reason'
);

select * from finish();
rollback;
