begin;

select plan(5);

insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
values (
  '33333333-3333-4333-8333-333333333333',
  'notes-owner@example.test',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{}'::jsonb
);

insert into public.sports_competitions(id,canonical_key,name,country_code,competition_kind,division_level)
values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','test:notes:league','Notes League','BR','LEAGUE',1);

insert into public.sports_teams(id,canonical_key,name,country_code) values
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2','test:notes:home','Notes Home','BR'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3','test:notes:away','Notes Away','BR');

insert into public.sports_fixtures(
  id,canonical_key,primary_provider,primary_fixture_id,competition_id,kickoff_at,status,home_team_id,away_team_id
) values (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4','test:notes:fixture','test','notes-fixture',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',now()-interval '2 hours','FINISHED',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3'
);

insert into public.sports_players(id,canonical_key,name)
values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5','test:notes:player','Notes Player');

insert into public.sports_match_reviews(id,owner_id,fixture_id) values
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6','33333333-3333-4333-8333-333333333333','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7','44444444-4444-4444-8444-444444444444','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4');

insert into public.sports_review_field_marks(id,review_id,player_id,x_percent,y_percent,note) values
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5',25,60,'pressão'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb9','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7',null,75,40,'outro owner');

select ok(
  exists(select 1 from pg_tables where schemaname='public' and tablename='sports_review_field_marks'),
  'field marks table exists'
);

select throws_ok(
  $$insert into public.sports_review_field_marks(review_id,x_percent,y_percent) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6',101,50)$$,
  '23514',
  null,
  'x coordinate cannot exceed 100'
);

set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';

select is(
  (select count(*)::integer from public.sports_review_field_marks),
  1,
  'authenticated user sees only field marks from own reviews'
);

update public.sports_review_field_marks set note='tampered' where id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb9';

reset role;

select is(
  (select note from public.sports_review_field_marks where id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb9'),
  'outro owner',
  'RLS blocks updates to another owner field mark'
);

select ok(
  has_table_privilege('authenticated','public.sports_review_field_marks','SELECT')
  and not has_table_privilege('anon','public.sports_review_field_marks','SELECT'),
  'field marks remain authenticated-only'
);

select * from finish();
rollback;
