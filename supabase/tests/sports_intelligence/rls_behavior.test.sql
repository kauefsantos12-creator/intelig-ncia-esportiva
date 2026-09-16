begin;

select plan(5);

-- Fresh environments bind the app to the first valid Google auth user. Mirror that
-- production invariant inside this transaction before exercising owner-scoped RLS.
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
values (
  '11111111-1111-4111-8111-111111111111',
  'rls-owner@example.test',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{}'::jsonb
);

-- Seed application rows as the database owner. Only the approved auth identity above
-- needs to exist; the second owner UUID is deliberately not a valid application user.
insert into public.sports_competitions(id,canonical_key,name,country_code,competition_kind,division_level)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','test:rls:league','RLS League','DE','LEAGUE',1);

insert into public.sports_teams(id,canonical_key,name,country_code) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','test:rls:home','RLS Home','DE'),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','test:rls:away','RLS Away','DE');

insert into public.sports_fixtures(
  id,canonical_key,primary_provider,primary_fixture_id,competition_id,kickoff_at,status,home_team_id,away_team_id
) values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4','test:rls:fixture','test','rls-fixture',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',now()-interval '2 hours','FINISHED',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'
);

insert into public.sports_players(id,canonical_key,name)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5','test:rls:player','RLS Player');

insert into public.sports_match_reviews(id,owner_id,fixture_id,notes) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6','11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4','owner one note'),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7','22222222-2222-4222-8222-222222222222','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4','owner two note');

insert into public.sports_player_personal_ratings(review_id,player_id,participation_state,rating) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5','PARTICIPATED',8.0),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5','PARTICIPATED',7.0);

-- Match the official local RLS testing context: authenticated role + JWT subject.
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

select is(
  auth.uid(),
  '11111111-1111-4111-8111-111111111111'::uuid,
  'authenticated request resolves the approved user id'
);

select is(
  (select count(*)::integer from public.sports_match_reviews),
  1,
  'authenticated user sees only own review'
);

select is(
  (select count(*)::integer from public.sports_player_personal_ratings),
  1,
  'authenticated user sees only ratings linked to own review'
);

update public.sports_match_reviews
set notes='tampered'
where owner_id='22222222-2222-4222-8222-222222222222';

reset role;

select is(
  (select notes from public.sports_match_reviews where owner_id='22222222-2222-4222-8222-222222222222'),
  'owner two note',
  'RLS prevents modifying another user review'
);

select ok(
  has_table_privilege('authenticated','public.sports_team_elo_current','SELECT')
  and has_table_privilege('authenticated','public.sports_league_elo_current','SELECT')
  and not has_table_privilege('anon','public.sports_team_elo_current','SELECT')
  and not has_table_privilege('anon','public.sports_league_elo_current','SELECT'),
  'Elo views are authenticated-only'
);

select * from finish();
rollback;
