begin;
select plan(7);

select ok(
  to_regprocedure('public.get_recent_team_fixtures(uuid[],timestamptz,timestamptz,integer)') is not null,
  'recent team fixtures RPC exists'
);

select ok(
  not has_function_privilege('anon','public.get_recent_team_fixtures(uuid[],timestamptz,timestamptz,integer)','EXECUTE')
  and not has_function_privilege('authenticated','public.get_recent_team_fixtures(uuid[],timestamptz,timestamptz,integer)','EXECUTE')
  and has_function_privilege('service_role','public.get_recent_team_fixtures(uuid[],timestamptz,timestamptz,integer)','EXECUTE'),
  'recent form RPC is service-role only'
);

select ok(
  position('unnest' in lower(pg_get_functiondef('public.get_recent_team_fixtures(uuid[],timestamptz,timestamptz,integer)'::regprocedure))) > 0
  and position('p_team_ids' in pg_get_functiondef('public.get_recent_team_fixtures(uuid[],timestamptz,timestamptz,integer)'::regprocedure)) > 0,
  'recent form is scoped to supplied teams'
);

select ok(
  position('row_number() over' in lower(pg_get_functiondef('public.get_recent_team_fixtures(uuid[],timestamptz,timestamptz,integer)'::regprocedure))) > 0
  and position('partition by tt.team_id' in lower(pg_get_functiondef('public.get_recent_team_fixtures(uuid[],timestamptz,timestamptz,integer)'::regprocedure))) > 0,
  'recent form ranks independently per team'
);

select ok(
  position('recent_rank<=' in replace(lower(pg_get_functiondef('public.get_recent_team_fixtures(uuid[],timestamptz,timestamptz,integer)'::regprocedure)),' ','')) > 0,
  'recent form limits after per-team ranking'
);

select ok(
  position('distinct on (fixture_id)' in lower(pg_get_functiondef('public.get_recent_team_fixtures(uuid[],timestamptz,timestamptz,integer)'::regprocedure))) > 0,
  'fixtures shared by two tracked teams are deduplicated'
);

select ok(
  position('f.status = ''FINISHED''' in pg_get_functiondef('public.get_recent_team_fixtures(uuid[],timestamptz,timestamptz,integer)'::regprocedure)) > 0
  or position('f.status=''FINISHED''' in replace(pg_get_functiondef('public.get_recent_team_fixtures(uuid[],timestamptz,timestamptz,integer)'::regprocedure),' ','')) > 0,
  'only finished fixtures feed recent form'
);

select * from finish();
rollback;
