begin;
select plan(5);

insert into public.elo_league_ratings(
  model_version,league_id,league_key,league_name,country_code,region,division_level,
  focus_role,prior_rating,rating,evidence_adjustment,evidence_matches,hierarchy_constrained,updated_at
) values
  ('league-elo-v1',990910001,'test-old-league','Test Old League','ZZ','EUROPE',1,'SUPPORT',1500,1500,0,0,false,now()),
  ('league-elo-v1',990910002,'test-current-league','Test Current League','ZZ','EUROPE',1,'SUPPORT',1550,1550,0,0,false,now())
on conflict(model_version,league_id) do update set rating=excluded.rating,updated_at=excluded.updated_at;

insert into public.elo_team_ratings(
  model_version,league_id,league_key,league_name,team_id,team_name,rating,
  matches_processed,first_fixture_at,last_fixture_at,updated_at
) values
  ('elo-v1-w020',990910001,'test-old-league','Test Old League',990920001,'Test Promoted Club',1600,30,
   '2025-08-01 12:00:00+00','2026-05-20 12:00:00+00','2026-09-20 06:00:00+00'),
  ('elo-v1-w020',990910002,'test-current-league','Test Current League',990920001,'Test Promoted Club',1510,5,
   '2026-08-01 12:00:00+00','2026-09-19 12:00:00+00','2026-09-20 07:00:00+00');

select is(
  (select count(*)::integer from public.elo_global_team_ratings where team_id=990920001),
  1,
  'global Elo read model exposes one current row per team'
);

select is(
  (select league_id from public.elo_global_team_ratings where team_id=990920001),
  990910002::bigint,
  'current row follows the league of the most recent fixture'
);

select is(
  (select local_rating from public.elo_global_team_ratings where team_id=990920001),
  1510::numeric,
  'current local rating comes from the latest league context'
);

select is(
  (select global_rating from public.elo_global_team_ratings where team_id=990920001),
  1560::numeric,
  'global rating still equals league rating plus local deviation from 1500'
);

select is(
  (select count(*)::integer from public.elo_team_ratings where team_id=990920001),
  2,
  'historical league-local rating rows are preserved'
);

select * from finish();
rollback;
