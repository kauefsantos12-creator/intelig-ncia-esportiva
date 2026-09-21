begin;

insert into public.sports_tracking_rules (
  rule_key,country_code,region,competition_kind,division_level,competition_id,
  always_track,enabled,priority,metadata
)
select
  'test-second-league-' || country_code,
  country_code,null,'LEAGUE',2,null,true,true,100,
  jsonb_build_object('label','second division test')
from (values ('BR'),('GB-ENG'),('DE'),('FR'),('IT'),('ES')) v(country_code)
on conflict (rule_key) do update set enabled=true,always_track=true;

do $$
declare
  v_missing text;
begin
  select string_agg(country_code, ', ' order by country_code)
  into v_missing
  from (values ('BR'),('GB-ENG'),('DE'),('FR'),('IT'),('ES')) expected(country_code)
  where not exists (
    select 1
    from public.sports_tracking_rules r
    where r.enabled=true
      and r.always_track=true
      and r.country_code=expected.country_code
      and r.competition_kind='LEAGUE'
      and r.division_level=2
  );

  if v_missing is not null then
    raise exception 'Missing second-division tracking rules: %', v_missing;
  end if;
end $$;

rollback;
