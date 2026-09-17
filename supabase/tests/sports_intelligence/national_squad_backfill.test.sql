begin;
select plan(6);

select ok(
  to_regclass('public.sports_team_competitions') is not null,
  'team-to-competition membership table exists'
);

select ok(
  exists (
    select 1 from pg_indexes
    where schemaname='public'
      and tablename='sports_team_competitions'
      and indexname='sports_team_competitions_team_idx'
  ),
  'team membership lookup index exists'
);

select is(
  (select count(*)::integer from public.sports_competitions
   where season='2026/27' and active and api_football_league_id in (39,61,71,78,135,140)),
  6,
  'all six priority national leagues exist exactly once in the canonical catalog'
);

select is(
  (select count(distinct api_football_league_id)::integer from public.sports_competitions
   where season='2026/27' and active and api_football_league_id in (39,61,71,78,135,140)),
  6,
  'priority national league provider ids are unique in the target set'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='sports_team_competitions'
      and policyname='sports_team_competitions_authenticated_read'
      and roles @> array['authenticated']::name[]
  ),
  'authenticated users have read policy for team memberships'
);

select ok(
  not has_table_privilege('anon', 'public.sports_team_competitions', 'SELECT')
  and has_table_privilege('authenticated', 'public.sports_team_competitions', 'SELECT')
  and has_table_privilege('service_role', 'public.sports_team_competitions', 'INSERT,UPDATE,DELETE'),
  'membership table grants preserve read-only client boundary'
);

select * from finish();
rollback;
