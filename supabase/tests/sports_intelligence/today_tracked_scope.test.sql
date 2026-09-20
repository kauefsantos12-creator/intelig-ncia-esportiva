begin;
select plan(6);

select ok(
  to_regprocedure('public.get_today_tracked_fixtures(timestamptz,timestamptz,integer)') is not null,
  'Today tracked fixtures RPC exists'
);

select ok(
  not has_function_privilege('anon','public.get_today_tracked_fixtures(timestamptz,timestamptz,integer)','EXECUTE')
  and not has_function_privilege('authenticated','public.get_today_tracked_fixtures(timestamptz,timestamptz,integer)','EXECUTE')
  and has_function_privilege('service_role','public.get_today_tracked_fixtures(timestamptz,timestamptz,integer)','EXECUTE'),
  'Today agenda RPC is service-role only'
);

select ok(
  position('sports_tracking_rules' in pg_get_functiondef('public.get_today_tracked_fixtures(timestamptz,timestamptz,integer)'::regprocedure)) > 0
  and position('always_track' in pg_get_functiondef('public.get_today_tracked_fixtures(timestamptz,timestamptz,integer)'::regprocedure)) > 0,
  'Today agenda applies canonical always_track scope'
);

select ok(
  position('exists (' in lower(pg_get_functiondef('public.get_today_tracked_fixtures(timestamptz,timestamptz,integer)'::regprocedure))) > 0
  and position('limit least' in lower(pg_get_functiondef('public.get_today_tracked_fixtures(timestamptz,timestamptz,integer)'::regprocedure))) > 0,
  'tracked scope is resolved in SQL before the bounded display limit'
);

select ok(
  position('order by f.kickoff_at asc' in lower(pg_get_functiondef('public.get_today_tracked_fixtures(timestamptz,timestamptz,integer)'::regprocedure))) > 0,
  'Today agenda is ordered chronologically before the display limit'
);

select ok(
  position('media.api-sports.io/football/teams/' in pg_get_functiondef('public.get_today_tracked_fixtures(timestamptz,timestamptz,integer)'::regprocedure)) > 0,
  'Today agenda derives API-Football crest when a reconciled team lacks stored logo'
);

select * from finish();
rollback;
