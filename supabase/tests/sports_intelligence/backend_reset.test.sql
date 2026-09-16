begin;
select plan(19);

select ok(to_regclass('public.sports_fixtures') is not null,'canonical sports fixtures table exists');
select ok(to_regclass('public.sports_fixture_player_stats') is not null,'player participation/statistics table exists');
select ok(to_regclass('public.sports_match_reviews') is not null,'personal match reviews table exists');
select ok(to_regclass('public.sports_jobs') is not null,'idempotent sports jobs table exists');

select ok(to_regclass('public.analysis_runs') is null,'legacy analysis_runs is removed');
select ok(to_regclass('public.user_odds') is null,'legacy user_odds is removed');
select ok(to_regclass('public.experimental_bankroll_config') is null,'legacy bankroll is removed');
select ok(to_regclass('public.model_predictions') is null,'legacy model predictions are removed');

select ok(to_regclass('public.elo_global_team_ratings') is not null,'Elo team ratings are preserved');
select ok(to_regprocedure('public.elo_sync_next_target_when_idle()') is not null,'Elo idle sync helper is preserved');
select ok(position('analysis_jobs' in lower(pg_get_functiondef('public.elo_sync_next_target_when_idle()'::regprocedure)))=0,'Elo helper no longer depends on analysis_jobs');
select ok(to_regprocedure('public.elo_refresh_cross_fixtures_from_raw()') is null,'raw_observations Elo bridge is retired');

select ok(not exists(select 1 from cron.job where jobname='five-dollar-maintenance-daily'),'legacy 5Dollar maintenance cron is removed');
select ok(exists(select 1 from cron.job where jobname='sports-intelligence-maintenance' and active),'sports intelligence maintenance cron is active');

select ok(position('analysis_runs' in lower(pg_get_functiondef('public.erase_user_application_data(uuid)'::regprocedure)))=0,'privacy erasure no longer references analysis_runs');
select ok(position('experimental_bankroll' in lower(pg_get_functiondef('public.erase_user_application_data(uuid)'::regprocedure)))=0,'privacy erasure no longer references bankroll');

insert into public.sports_competitions(canonical_key,name,country_code,competition_kind,division_level)
values('test:bundesliga','Bundesliga Test','DE','LEAGUE',1);
insert into public.sports_teams(canonical_key,name,country_code) values
('test:home','Home Test','DE'),('test:away','Away Test','DE');
insert into public.sports_fixtures(canonical_key,primary_provider,primary_fixture_id,competition_id,kickoff_at,status,home_team_id,away_team_id,home_goals,away_goals)
select 'test:fixture','test','fixture-1',c.id,now()-interval '3 hours','FINISHED',h.id,a.id,2,1
from public.sports_competitions c, public.sports_teams h, public.sports_teams a
where c.canonical_key='test:bundesliga' and h.canonical_key='test:home' and a.canonical_key='test:away';

select ok(public.sports_fixture_is_review_eligible((select id from public.sports_fixtures where canonical_key='test:fixture')),'always-track league is review eligible without broadcast evidence');

select lives_ok($$select public.enqueue_sports_job('test:dedupe','TEST',null,'{}'::jsonb,3)$$,'sports job can be enqueued');
select is((select count(*)::integer from public.sports_jobs where idempotency_key='test:dedupe'),1,'job idempotency key is unique');

select * from finish();
rollback;
