begin;
select plan(6);

select ok(
  to_regprocedure('public.get_recent_priority_results(timestamptz,integer)') is not null,
  'recent priority results RPC exists'
);

select ok(
  not has_function_privilege('anon','public.get_recent_priority_results(timestamptz,integer)','EXECUTE')
  and not has_function_privilege('authenticated','public.get_recent_priority_results(timestamptz,integer)','EXECUTE')
  and has_function_privilege('service_role','public.get_recent_priority_results(timestamptz,integer)','EXECUTE'),
  'recent results RPC is service-role only'
);

select ok(
  position('sports_tracking_rules' in pg_get_functiondef('public.get_recent_priority_results(timestamptz,integer)'::regprocedure)) > 0,
  'recent results RPC applies canonical tracking rules'
);

select ok(
  position('order by f.kickoff_at desc' in lower(pg_get_functiondef('public.get_recent_priority_results(timestamptz,integer)'::regprocedure))) > 0,
  'recent results RPC sorts before display limit'
);

select ok(
  position('media.api-sports.io/football/teams/' in pg_get_functiondef('public.get_recent_priority_results(timestamptz,integer)'::regprocedure)) > 0,
  'recent results RPC derives a crest from API-Football id when needed'
);

select ok(
  position('limit least' in lower(pg_get_functiondef('public.get_recent_priority_results(timestamptz,integer)'::regprocedure))) > 0,
  'recent results RPC bounds its requested limit'
);

select * from finish();
rollback;
