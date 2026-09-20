begin;
select plan(6);

select ok(
  to_regprocedure('public.get_recent_elo_movements(timestamptz,integer)') is not null,
  'recent Elo movements RPC exists'
);

select ok(
  not has_function_privilege('anon','public.get_recent_elo_movements(timestamptz,integer)','EXECUTE')
  and not has_function_privilege('authenticated','public.get_recent_elo_movements(timestamptz,integer)','EXECUTE')
  and has_function_privilege('service_role','public.get_recent_elo_movements(timestamptz,integer)','EXECUTE'),
  'recent Elo movements RPC is service-role only'
);

select ok(
  position('elo-v1-w020' in pg_get_functiondef('public.get_recent_elo_movements(timestamptz,integer)'::regprocedure)) > 0,
  'recent Elo movements use the canonical local model version'
);

select ok(
  position('abs(m.delta)>=2' in replace(lower(pg_get_functiondef('public.get_recent_elo_movements(timestamptz,integer)'::regprocedure)),' ','')) > 0,
  'recent Elo movements apply the display relevance floor'
);

select ok(
  position('order by abs(m.delta) desc' in lower(pg_get_functiondef('public.get_recent_elo_movements(timestamptz,integer)'::regprocedure))) > 0,
  'recent Elo movements rank by impact before display limit'
);

select ok(
  position('limit least' in lower(pg_get_functiondef('public.get_recent_elo_movements(timestamptz,integer)'::regprocedure))) > 0,
  'recent Elo movements bound their requested limit'
);

select * from finish();
rollback;
