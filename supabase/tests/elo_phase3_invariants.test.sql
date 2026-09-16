begin;
select plan(8);

select ok(to_regclass('public.elo_fixtures') is not null, 'Elo fixture ledger exists');
select ok(to_regclass('public.elo_fixture_history') is not null, 'Elo fixture history exists');
select ok(to_regclass('public.elo_team_ratings') is not null, 'Elo team ratings exist');
select ok(to_regclass('public.elo_league_ratings') is not null, 'Elo league ratings exist');

select ok(
  exists (
    select 1
    from pg_catalog.pg_constraint c
    where c.conrelid = 'public.elo_fixtures'::regclass
      and c.contype in ('p','u')
      and pg_catalog.pg_get_constraintdef(c.oid) like '%source%league_id%fixture_id%'
  ),
  'fixture ledger prevents duplicate source/league/fixture identities'
);

select ok(
  to_regprocedure('public.elo_finalize_daily()') is not null,
  'daily Elo finalize function exists'
);

select is(
  pg_catalog.regexp_count(
    pg_catalog.pg_get_functiondef('public.elo_finalize_daily()'::pg_catalog.regprocedure),
    'elo_rebuild_league_ratings\(\)'
  ),
  1,
  'daily Elo finalize rebuilds league hierarchy exactly once'
);

select is(
  pg_catalog.regexp_count(
    pg_catalog.pg_get_functiondef('public.elo_finalize_daily()'::pg_catalog.regprocedure),
    'elo_run_audit\(\)'
  ),
  1,
  'daily Elo finalize executes integrity audit exactly once'
);

select * from finish();
rollback;
