begin;

select plan(24);

create temp table expected_shared_sports_table(table_name text primary key) on commit drop;
insert into expected_shared_sports_table(table_name) values
  ('sports_competitions'),('sports_teams'),('sports_fixtures'),('sports_fixture_team_stats'),
  ('sports_fixture_events'),('sports_match_fact_packs'),('sports_players'),('sports_team_squads'),
  ('sports_fixture_lineups'),('sports_fixture_player_stats'),('sports_injuries'),
  ('sports_broadcast_evidence'),('sports_tracking_rules'),('sports_sync_state'),
  ('sports_daily_briefings'),('sports_briefing_items'),('sports_standings'),('sports_player_season_stats');

select ok(
  not exists (
    select 1 from expected_shared_sports_table e
    where to_regclass(format('public.%I', e.table_name)) is null
  ),
  'all canonical shared sports tables exist'
);

select ok(
  not exists (
    select 1
    from expected_shared_sports_table e
    join pg_class c on c.oid = to_regclass(format('public.%I', e.table_name))
    where not c.relrowsecurity
  ),
  'shared sports tables have RLS enabled'
);

select ok(
  not exists (
    select 1 from expected_shared_sports_table e
    where has_table_privilege('anon', format('public.%I', e.table_name), 'SELECT')
       or has_table_privilege('anon', format('public.%I', e.table_name), 'INSERT')
       or has_table_privilege('anon', format('public.%I', e.table_name), 'UPDATE')
       or has_table_privilege('anon', format('public.%I', e.table_name), 'DELETE')
  ),
  'anonymous role has no access to shared sports tables'
);

select ok(
  not exists (
    select 1 from expected_shared_sports_table e
    where not has_table_privilege('authenticated', format('public.%I', e.table_name), 'SELECT')
  ),
  'authenticated role can read shared sports tables'
);

select ok(
  not exists (
    select 1 from expected_shared_sports_table e
    where has_table_privilege('authenticated', format('public.%I', e.table_name), 'INSERT')
       or has_table_privilege('authenticated', format('public.%I', e.table_name), 'UPDATE')
       or has_table_privilege('authenticated', format('public.%I', e.table_name), 'DELETE')
  ),
  'authenticated role cannot mutate shared sports tables'
);

select ok((select relrowsecurity from pg_class where oid='public.sports_match_reviews'::regclass), 'match reviews use RLS');
select is((select count(*)::integer from pg_policies where schemaname='public' and tablename='sports_match_reviews'), 4, 'match reviews have complete owner CRUD policies');
select ok(
  has_table_privilege('authenticated','public.sports_match_reviews','SELECT')
  and has_table_privilege('authenticated','public.sports_match_reviews','INSERT')
  and has_table_privilege('authenticated','public.sports_match_reviews','UPDATE')
  and has_table_privilege('authenticated','public.sports_match_reviews','DELETE'),
  'authenticated users can manage RLS-scoped reviews'
);
select ok(
  not has_table_privilege('anon','public.sports_match_reviews','SELECT')
  and not has_table_privilege('anon','public.sports_match_reviews','INSERT')
  and not has_table_privilege('anon','public.sports_match_reviews','UPDATE')
  and not has_table_privilege('anon','public.sports_match_reviews','DELETE'),
  'anonymous role cannot access personal reviews'
);

select ok((select relrowsecurity from pg_class where oid='public.sports_player_personal_ratings'::regclass), 'personal player ratings use RLS');
select is((select count(*)::integer from pg_policies where schemaname='public' and tablename='sports_player_personal_ratings'), 4, 'personal ratings have complete owner CRUD policies');
select ok(
  has_table_privilege('authenticated','public.sports_player_personal_ratings','SELECT')
  and has_table_privilege('authenticated','public.sports_player_personal_ratings','INSERT')
  and has_table_privilege('authenticated','public.sports_player_personal_ratings','UPDATE')
  and has_table_privilege('authenticated','public.sports_player_personal_ratings','DELETE'),
  'authenticated users can manage RLS-scoped ratings'
);
select ok(
  not has_table_privilege('anon','public.sports_player_personal_ratings','SELECT')
  and not has_table_privilege('anon','public.sports_player_personal_ratings','INSERT')
  and not has_table_privilege('anon','public.sports_player_personal_ratings','UPDATE')
  and not has_table_privilege('anon','public.sports_player_personal_ratings','DELETE'),
  'anonymous role cannot access personal ratings'
);

select ok((select relrowsecurity from pg_class where oid='public.sports_jobs'::regclass), 'sports job queue uses RLS');
select ok(
  not has_table_privilege('anon','public.sports_jobs','SELECT')
  and not has_table_privilege('authenticated','public.sports_jobs','SELECT')
  and not has_table_privilege('anon','public.sports_jobs','INSERT')
  and not has_table_privilege('authenticated','public.sports_jobs','INSERT')
  and not has_table_privilege('anon','public.sports_jobs','UPDATE')
  and not has_table_privilege('authenticated','public.sports_jobs','UPDATE')
  and not has_table_privilege('anon','public.sports_jobs','DELETE')
  and not has_table_privilege('authenticated','public.sports_jobs','DELETE'),
  'browser roles cannot access the operational job queue'
);
select ok(
  has_table_privilege('service_role','public.sports_jobs','SELECT')
  and has_table_privilege('service_role','public.sports_jobs','INSERT')
  and has_table_privilege('service_role','public.sports_jobs','UPDATE')
  and has_table_privilege('service_role','public.sports_jobs','DELETE'),
  'service role retains operational job queue access'
);

select ok(
  not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.prosecdef
      and p.proname in (
        'enqueue_finished_sports_reviews','auto_close_sports_reviews','enqueue_sports_job',
        'claim_sports_job','complete_sports_job','fail_sports_job'
      )
      and (has_function_privilege('anon',p.oid,'EXECUTE') or has_function_privilege('authenticated',p.oid,'EXECUTE'))
  ),
  'browser roles cannot execute privileged sports backend RPCs'
);

select ok(
  not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.prosecdef
      and p.proname in (
        'enqueue_finished_sports_reviews','auto_close_sports_reviews','enqueue_sports_job',
        'claim_sports_job','complete_sports_job','fail_sports_job'
      )
      and not has_function_privilege('service_role',p.oid,'EXECUTE')
  ),
  'service role can execute privileged sports backend RPCs'
);

select ok(
  not has_schema_privilege('anon','public','CREATE')
  and not has_schema_privilege('authenticated','public','CREATE'),
  'browser roles cannot create objects in the public schema'
);

select ok(
  exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='sports_match_reviews'
      and column_name='owner_id' and is_nullable='NO'
  ),
  'review ownership is mandatory'
);

select ok(
  exists (
    select 1 from pg_constraint c
    where c.conrelid='public.sports_match_reviews'::regclass
      and c.contype='u'
      and lower(pg_get_constraintdef(c.oid)) like '%unique (owner_id, fixture_id)%'
  ),
  'one review per owner and fixture is enforced'
);

select ok(
  exists (
    select 1 from pg_constraint c
    where c.conrelid='public.sports_jobs'::regclass
      and c.contype='u'
      and lower(pg_get_constraintdef(c.oid)) like '%unique (idempotency_key)%'
  ),
  'sports job idempotency key is unique'
);

select ok(
  exists (
    select 1 from pg_constraint c
    where c.conrelid='public.sports_fixtures'::regclass
      and c.conname='sports_fixtures_distinct_teams'
      and c.contype='c'
  ),
  'fixtures cannot use the same home and away team'
);

select ok(
  (select count(*)::integer from pg_constraint c
   where c.conrelid='public.sports_player_personal_ratings'::regclass
     and c.conname in ('sports_personal_rating_range','sports_personal_rating_step','sports_personal_rating_participation')) = 3,
  'personal ratings enforce range, half-point steps and participation'
);

select * from finish();
rollback;
