begin;
select plan(22);

-- Authorize each fixture identity during setup, inside this rolled-back transaction.
-- The test runner has DML grants on Auth, but does not own its protected schema.
update private.app_security_config set approved_user_id='12121212-1212-4212-8212-121212121212' where singleton;
insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values
('12121212-1212-4212-8212-121212121212','report-owner@example.test','{"provider":"google"}','{}');
update private.app_security_config set approved_user_id='13131313-1313-4313-8313-131313131313' where singleton;
insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values
('13131313-1313-4313-8313-131313131313','other-owner@example.test','{"provider":"google"}','{}');
update private.app_security_config set approved_user_id='12121212-1212-4212-8212-121212121212' where singleton;
insert into public.sports_personal_match_reports(id,owner_id,home_team,away_team,kickoff_at,notes)
values('14141414-1414-4414-8414-141414141414','13131313-1313-4313-8313-131313131313','Other A','Other B',now(),'private other');
select set_config('test.personal_report_fixture_count',(select count(*)::text from public.sports_fixtures),true);

select ok((select relrowsecurity from pg_class where oid='public.sports_personal_match_reports'::regclass),'reports have RLS');
select ok(not has_table_privilege('anon','public.sports_personal_match_reports','SELECT')
  and not has_function_privilege('anon','public.save_personal_match_report(uuid,integer,text,text,text,timestamptz,text)','EXECUTE'),'anonymous cannot read or save');
select ok(not has_column_privilege('authenticated','public.sports_personal_match_reports','owner_id','UPDATE'),'owner cannot be reassigned by API');

set local role authenticated;
set local request.jwt.claim.sub='12121212-1212-4212-8212-121212121212';
select is((select count(*)::integer from public.sports_personal_match_reports),0,'other reports are hidden');
select is((select version from public.save_personal_match_report('15151515-1515-4515-8515-151515151515',0,'Home','Away',null,'2030-10-16 23:00Z','first note')),1,'future game can be created without fixture ingestion');
select is((select version from public.save_personal_match_report('15151515-1515-4515-8515-151515151515',0,'Home','Away',null,'2030-10-16 23:00Z','first note')),1,'retry of create is idempotent');
select is((select notes from public.sports_personal_match_reports where id='15151515-1515-4515-8515-151515151515'),'first note','saved report can be reopened');
select is((select version from public.save_personal_match_report('15151515-1515-4515-8515-151515151515',1,'Home','Away',null,'2030-10-16 23:00Z','edited note')),2,'editing advances version');
select throws_ok($$select * from public.save_personal_match_report('15151515-1515-4515-8515-151515151515',1,'Home','Away',null,'2030-10-16 23:00Z','stale overwrite')$$,'40001',null,'stale version cannot overwrite');
select is((select notes from public.sports_personal_match_reports where id='15151515-1515-4515-8515-151515151515'),'edited note','conflict preserves saved text');
select is((select version from public.save_personal_match_report('15151515-1515-4515-8515-151515151515',1,'Home','Away',null,'2030-10-16 23:00Z','edited note')),2,'retry after lost edit acknowledgement is idempotent');
select throws_ok($$insert into public.sports_personal_match_reports(owner_id,home_team,away_team,kickoff_at) values('13131313-1313-4313-8313-131313131313','A','B',now())$$,'42501',null,'forged owner is rejected');
select throws_ok($$select * from public.save_personal_match_report('16161616-1616-4616-8616-161616161616',0,' ','B',null,now(),'')$$,'23514',null,'blank team is rejected');
select throws_ok($$select * from public.save_personal_match_report('16161616-1616-4616-8616-161616161616',0,'A','B',null,now(),repeat('a',4001))$$,'23514',null,'overlong report is rejected');

set local request.jwt.claim.sub='13131313-1313-4313-8313-131313131313';
select is((select count(*)::integer from public.sports_personal_match_reports),0,'unapproved Google account sees no reports, including its own');
select throws_ok($$select * from public.save_personal_match_report('16161616-1616-4616-8616-161616161616',0,'A','B',null,now(),'unauthorized')$$,'42501',null,'unapproved Google account cannot use save RPC');
with changed as (update public.sports_personal_match_reports set notes='tampered' where id='15151515-1515-4515-8515-151515151515' returning id)
select is((select count(*)::integer from changed),0,'another account cannot edit approved owner report');
reset role;
select is((select notes from public.sports_personal_match_reports where id='14141414-1414-4414-8414-141414141414'),'private other','other account text stays unchanged');
do $$begin perform public.erase_user_application_data('12121212-1212-4212-8212-121212121212'); end$$;
select ok(not exists(select 1 from public.sports_personal_match_reports where owner_id='12121212-1212-4212-8212-121212121212')
  and exists(select 1 from public.sports_personal_match_reports where owner_id='13131313-1313-4313-8313-131313131313'),'account erasure is owner scoped');
select ok(not has_function_privilege('authenticated','public.erase_user_application_data(uuid)','EXECUTE'),'erasure remains server privileged');
delete from auth.users where id='13131313-1313-4313-8313-131313131313';
select is((select count(*)::integer from public.sports_personal_match_reports),0,'deleting auth account removes its personal report');
select is((select count(*)::integer from public.sports_fixtures),current_setting('test.personal_report_fixture_count')::integer,'personal reports never create official fixtures');
select * from finish();
rollback;
