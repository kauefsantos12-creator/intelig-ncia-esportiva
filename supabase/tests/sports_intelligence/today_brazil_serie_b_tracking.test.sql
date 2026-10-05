begin;
select plan(2);

-- Seeded by 20260921123500_today_brazil_serie_b_tracking.sql: the principal
-- countries' second divisions are always tracked in Today.
select is(
  (
    select count(*)::integer
    from public.sports_tracking_rules r
    where r.rule_key in (
      'always-brazil-second-league',
      'always-england-second-league',
      'always-germany-second-league',
      'always-france-second-league',
      'always-italy-second-league',
      'always-spain-second-league'
    )
      and r.enabled = true
      and r.always_track = true
      and r.competition_kind = 'LEAGUE'
      and r.division_level = 2
  ),
  6,
  'Six second-division Today tracking rules are seeded and enabled'
);

select is(
  (
    select string_agg(expected.country_code, ', ' order by expected.country_code)
    from (values ('BR'), ('GB-ENG'), ('DE'), ('FR'), ('IT'), ('ES')) expected(country_code)
    where not exists (
      select 1
      from public.sports_tracking_rules r
      where r.enabled = true
        and r.always_track = true
        and r.country_code = expected.country_code
        and r.competition_kind = 'LEAGUE'
        and r.division_level = 2
    )
  ),
  null,
  'Every principal country has an enabled second-division tracking rule'
);

select * from finish();
rollback;
