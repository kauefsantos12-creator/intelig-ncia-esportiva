begin;
select no_plan();
update private.app_security_config set approved_user_id='71717171-7171-4171-8171-717171717171' where singleton;
insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values
('71717171-7171-4171-8171-717171717171','pitch-owner@example.test','{"provider":"google"}','{}');
update private.app_security_config set approved_user_id='72727272-7272-4272-8272-727272727272' where singleton;
insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values
('72727272-7272-4272-8272-727272727272','pitch-other@example.test','{"provider":"google"}','{}');
update private.app_security_config set approved_user_id='71717171-7171-4171-8171-717171717171' where singleton;
insert into public.sports_competitions(id,canonical_key,name,country_code,competition_kind,division_level)
values('cccccccc-cccc-4ccc-8ccc-cccccccccc01','test:pitch:league','Pitch League','BR','LEAGUE',1);
insert into public.sports_teams(id,canonical_key,name,country_code) values
('cccccccc-cccc-4ccc-8ccc-cccccccccc02','test:pitch:home','Pitch Home','BR'),
('cccccccc-cccc-4ccc-8ccc-cccccccccc03','test:pitch:away','Pitch Away','BR');
insert into public.sports_fixtures(id,canonical_key,primary_provider,primary_fixture_id,competition_id,kickoff_at,status,home_team_id,away_team_id) values
('cccccccc-cccc-4ccc-8ccc-cccccccccc04','test:pitch:now','test','pitch-now','cccccccc-cccc-4ccc-8ccc-cccccccccc01',now()-interval '1 hour','SCHEDULED','cccccccc-cccc-4ccc-8ccc-cccccccccc02','cccccccc-cccc-4ccc-8ccc-cccccccccc03'),
('cccccccc-cccc-4ccc-8ccc-cccccccccc05','test:pitch:future','test','pitch-future','cccccccc-cccc-4ccc-8ccc-cccccccccc01',now()+interval '1 day','SCHEDULED','cccccccc-cccc-4ccc-8ccc-cccccccccc02','cccccccc-cccc-4ccc-8ccc-cccccccccc03');
insert into public.sports_players(id,canonical_key,name) values
('cccccccc-cccc-4ccc-8ccc-cccccccccc06','test:pitch:starter','Pitch Starter'),
('cccccccc-cccc-4ccc-8ccc-cccccccccc07','test:pitch:bench','Pitch Bench'),
('cccccccc-cccc-4ccc-8ccc-cccccccccc08','test:pitch:unrelated','Unrelated');
insert into public.sports_fixture_lineups(fixture_id,team_id,player_id,provider,is_starting,is_substitute) values
('cccccccc-cccc-4ccc-8ccc-cccccccccc04','cccccccc-cccc-4ccc-8ccc-cccccccccc02','cccccccc-cccc-4ccc-8ccc-cccccccccc06','api_football',true,false),
('cccccccc-cccc-4ccc-8ccc-cccccccccc04','cccccccc-cccc-4ccc-8ccc-cccccccccc02','cccccccc-cccc-4ccc-8ccc-cccccccccc07','api_football',false,true),
('cccccccc-cccc-4ccc-8ccc-cccccccccc05','cccccccc-cccc-4ccc-8ccc-cccccccccc02','cccccccc-cccc-4ccc-8ccc-cccccccccc06','api_football',true,false);
insert into public.sports_match_reviews(id,owner_id,fixture_id,watched,notes) values
('cccccccc-cccc-4ccc-8ccc-cccccccccc09','72727272-7272-4272-8272-727272727272','cccccccc-cccc-4ccc-8ccc-cccccccccc04',true,'Private other review');
insert into public.sports_player_personal_ratings(review_id,player_id,participation_state,rating,notes)
values('cccccccc-cccc-4ccc-8ccc-cccccccccc09','cccccccc-cccc-4ccc-8ccc-cccccccccc06','PARTICIPATED',5,'Private other rating');
select ok(not (select prosecdef from pg_proc where oid='public.save_pitch_player_rating(uuid,uuid,numeric,boolean,timestamptz)'::regprocedure),'pitch RPC is security invoker');
select ok(not has_function_privilege('anon','public.save_pitch_player_rating(uuid,uuid,numeric,boolean,timestamptz)','EXECUTE'),'anonymous cannot execute');
set local role authenticated;
set local request.jwt.claim.sub='71717171-7171-4171-8171-717171717171';
select throws_ok($$select * from public.save_pitch_player_rating('cccccccc-cccc-4ccc-8ccc-cccccccccc04','cccccccc-cccc-4ccc-8ccc-cccccccccc06',7.5,false,null)$$,'22023',null,'starter requires explicit participation confirmation');
select throws_ok($$select * from public.save_pitch_player_rating('cccccccc-cccc-4ccc-8ccc-cccccccccc04','cccccccc-cccc-4ccc-8ccc-cccccccccc07',7.5,false,null)$$,'22023',null,'bench listing alone never confirms participation');
select throws_ok($$select * from public.save_pitch_player_rating('cccccccc-cccc-4ccc-8ccc-cccccccccc04','cccccccc-cccc-4ccc-8ccc-cccccccccc08',7.5,true,null)$$,'22023',null,'unrelated player rejected');
select throws_ok($$select * from public.save_pitch_player_rating('cccccccc-cccc-4ccc-8ccc-cccccccccc05','cccccccc-cccc-4ccc-8ccc-cccccccccc06',7.5,true,null)$$,'22023',null,'future fixture rejected');
select throws_ok($$select * from public.save_pitch_player_rating('cccccccc-cccc-4ccc-8ccc-cccccccccc04','cccccccc-cccc-4ccc-8ccc-cccccccccc06',7.1,true,null)$$,'22023',null,'half point step enforced');
select throws_ok($$select * from public.save_pitch_player_rating('cccccccc-cccc-4ccc-8ccc-cccccccccc04','cccccccc-cccc-4ccc-8ccc-cccccccccc06',10.5,true,null)$$,'22023',null,'range enforced');
select is((select rating from public.save_pitch_player_rating('cccccccc-cccc-4ccc-8ccc-cccccccccc04','cccccccc-cccc-4ccc-8ccc-cccccccccc06',7.5,true,null)),7.5::numeric,'saves personal rating during a manually observed fixture');
select is((select count(*)::integer from public.sports_match_reviews),1,'owner sees only own review');
select is((select watched from public.sports_match_reviews where fixture_id='cccccccc-cccc-4ccc-8ccc-cccccccccc04'),true,'explicit user observation marks own review watched');
select set_config('test.pitch.original_token',(select updated_at::text from public.sports_player_personal_ratings where player_id='cccccccc-cccc-4ccc-8ccc-cccccccccc06'),true);
select is((select updated_at::text from public.save_pitch_player_rating('cccccccc-cccc-4ccc-8ccc-cccccccccc04','cccccccc-cccc-4ccc-8ccc-cccccccccc06',7.5,true,null)),current_setting('test.pitch.original_token'),'retry is idempotent and does not change token');
select is((select rating from public.save_pitch_player_rating('cccccccc-cccc-4ccc-8ccc-cccccccccc04','cccccccc-cccc-4ccc-8ccc-cccccccccc06',8,true,current_setting('test.pitch.original_token')::timestamptz)),8::numeric,'editing uses expected token');
select throws_ok($$select * from public.save_pitch_player_rating('cccccccc-cccc-4ccc-8ccc-cccccccccc04','cccccccc-cccc-4ccc-8ccc-cccccccccc06',9,true,current_setting('test.pitch.original_token')::timestamptz)$$,'40001',null,'stale edit cannot overwrite newer score');
select is((select rating from public.sports_player_personal_ratings where player_id='cccccccc-cccc-4ccc-8ccc-cccccccccc06'),8::numeric,'conflict leaves saved score unchanged');
select is((select rating from public.save_pitch_player_rating('cccccccc-cccc-4ccc-8ccc-cccccccccc04','cccccccc-cccc-4ccc-8ccc-cccccccccc07',0,true,null)),0::numeric,'zero is a valid personal score for an observed substitute');
update public.sports_player_personal_ratings set notes='Keep personal note',provider_rating_snapshot=6.5 where player_id='cccccccc-cccc-4ccc-8ccc-cccccccccc06';
select is((select rating from public.save_pitch_player_rating('cccccccc-cccc-4ccc-8ccc-cccccccccc04','cccccccc-cccc-4ccc-8ccc-cccccccccc06',null,false,(select updated_at from public.sports_player_personal_ratings where player_id='cccccccc-cccc-4ccc-8ccc-cccccccccc06'))),null::numeric,'removes score without deleting personal row');
select is((select notes from public.sports_player_personal_ratings where player_id='cccccccc-cccc-4ccc-8ccc-cccccccccc06'),'Keep personal note','old personal note preserved');
select is((select provider_rating_snapshot from public.sports_player_personal_ratings where player_id='cccccccc-cccc-4ccc-8ccc-cccccccccc06'),6.5::numeric,'provider snapshot preserved');
select is((select count(*)::integer from public.sports_match_reviews where fixture_id='cccccccc-cccc-4ccc-8ccc-cccccccccc05'),0,'future rejection creates no review');
update public.sports_match_reviews set status='COMPLETED',finalized_at=now() where fixture_id='cccccccc-cccc-4ccc-8ccc-cccccccccc04';
select throws_ok($$select * from public.save_pitch_player_rating('cccccccc-cccc-4ccc-8ccc-cccccccccc04','cccccccc-cccc-4ccc-8ccc-cccccccccc06',9,true,(select updated_at from public.sports_player_personal_ratings where player_id='cccccccc-cccc-4ccc-8ccc-cccccccccc06'))$$,'55000',null,'finalized review cannot be changed');
set local request.jwt.claim.sub='72727272-7272-4272-8272-727272727272';
select is((select count(*)::integer from public.sports_player_personal_ratings),0,'unapproved account sees no ratings');
select throws_ok($$select * from public.save_pitch_player_rating('cccccccc-cccc-4ccc-8ccc-cccccccccc04','cccccccc-cccc-4ccc-8ccc-cccccccccc06',9,true,null)$$,'42501',null,'unapproved account cannot invoke write');
reset role;
select is((select rating from public.sports_player_personal_ratings where review_id='cccccccc-cccc-4ccc-8ccc-cccccccccc09'),5::numeric,'other account rating unchanged');
select is((select count(*)::integer from public.sports_fixture_player_stats where fixture_id='cccccccc-cccc-4ccc-8ccc-cccccccccc04'),0,'personal observations never create provider statistics');
select ok(exists(select 1 from public.sports_fixture_lineups where fixture_id='cccccccc-cccc-4ccc-8ccc-cccccccccc04' and player_id='cccccccc-cccc-4ccc-8ccc-cccccccccc07' and is_substitute and not is_starting),'substitute role is not rewritten');
select * from finish();
rollback;
