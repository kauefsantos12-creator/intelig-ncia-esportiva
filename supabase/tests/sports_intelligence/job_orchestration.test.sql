begin;
select plan(45);

select ok(to_regclass('public.sports_jobs') is not null, 'sports job queue exists');
select ok(to_regprocedure('public.enqueue_sports_job(text,text,uuid,jsonb,integer)') is not null, 'enqueue RPC exists');
select ok(to_regprocedure('public.claim_sports_job(uuid,integer)') is not null, 'claim RPC exists');
select ok(to_regprocedure('public.renew_sports_job_lease(uuid,uuid,integer)') is not null, 'lease renewal RPC exists');
select ok(to_regprocedure('public.complete_sports_job(uuid,uuid)') is not null, 'complete RPC exists');
select ok(to_regprocedure('public.fail_sports_job(uuid,uuid,text,integer)') is not null, 'fail RPC exists');
select ok(to_regprocedure('public.dead_sports_job(uuid,uuid,text)') is not null, 'terminal dead RPC exists');
select ok(to_regprocedure('public.verify_sports_worker_cron_token(text)') is not null, 'worker cron token verifier exists');
select ok(to_regprocedure('public.kick_sports_job_worker()') is not null, 'worker wake RPC exists');
select ok(to_regprocedure('public.kick_sports_daily_sync(integer)') is not null, 'daily sports producer wake RPC exists');

select ok(
  exists(select 1 from cron.job where jobname='sports-intelligence-maintenance' and active and schedule='*/15 * * * *'),
  'sports maintenance cron is active every 15 minutes'
);
select ok(
  exists(select 1 from cron.job where jobname='sports-job-worker-kick' and active and schedule='*/2 * * * *'),
  'sports worker wake cron is active every 2 minutes'
);
select ok(
  exists(select 1 from cron.job where jobname='sports-daily-sync-yesterday' and active and schedule='20 8 * * *'),
  'daily producer closes yesterday at 08:20 UTC'
);
select ok(
  exists(select 1 from cron.job where jobname='sports-daily-sync-today' and active and schedule='40 8 * * *'),
  'daily producer loads today at 08:40 UTC'
);
select ok(
  exists(select 1 from cron.job where jobname='elo-daily-finalize' and active and schedule='5 8 * * *'),
  'daily Elo finalize remains active at 08:05 UTC'
);
select ok(
  not exists(
    select 1 from cron.job
    where jobname in ('five-dollar-maintenance-daily','analysis-worker-watch','scheduled-d2-analysis','analysis-run-orphan-reconcile','stage9-daily-lab')
  ),
  'legacy analysis and maintenance crons stay retired'
);
select ok(
  position('skip locked' in lower(pg_get_functiondef('public.claim_sports_job(uuid,integer)'::regprocedure))) > 0,
  'claim uses skip locked for concurrent workers'
);
select ok(
  position('idempotency key collision' in lower(pg_get_functiondef('public.enqueue_sports_job(text,text,uuid,jsonb,integer)'::regprocedure))) > 0,
  'enqueue rejects semantic collisions on one idempotency key'
);
select ok(
  position('net.http_post' in lower(pg_get_functiondef('public.kick_sports_job_worker()'::regprocedure))) > 0,
  'worker wake dispatches through pg_net'
);
select ok(
  position('net.http_post' in lower(pg_get_functiondef('public.kick_sports_daily_sync(integer)'::regprocedure))) > 0,
  'daily producer dispatches through pg_net'
);
select is(
  has_function_privilege('anon','public.verify_sports_worker_cron_token(text)','EXECUTE'),
  false,
  'anon cannot execute worker cron token verifier'
);
select is(
  has_function_privilege('authenticated','public.verify_sports_worker_cron_token(text)','EXECUTE'),
  false,
  'authenticated users cannot execute worker cron token verifier'
);
select is(
  has_function_privilege('service_role','public.verify_sports_worker_cron_token(text)','EXECUTE'),
  true,
  'service role can execute worker cron token verifier'
);
select is(
  has_function_privilege('anon','public.kick_sports_daily_sync(integer)','EXECUTE'),
  false,
  'anon cannot execute daily producer wake'
);
select is(
  has_function_privilege('authenticated','public.kick_sports_daily_sync(integer)','EXECUTE'),
  false,
  'authenticated users cannot execute daily producer wake'
);
select is(
  has_function_privilege('service_role','public.kick_sports_daily_sync(integer)','EXECUTE'),
  true,
  'service role can execute daily producer wake'
);

select lives_ok(
  $$select public.enqueue_sports_job('part4:test:dedupe','TEST',null,'{"version":1}'::jsonb,2)$$,
  'job can be enqueued'
);
select lives_ok(
  $$select public.enqueue_sports_job('part4:test:dedupe','TEST',null,'{"version":1}'::jsonb,2)$$,
  'identical enqueue is idempotent'
);
select is(
  (select count(*)::integer from public.sports_jobs where idempotency_key='part4:test:dedupe'),
  1,
  'identical enqueue creates exactly one job'
);
select is(
  (select payload->>'version' from public.sports_jobs where idempotency_key='part4:test:dedupe'),
  '1',
  'idempotent replay preserves the original payload'
);

select is(
  (select status from public.claim_sports_job('00000000-0000-0000-0000-000000000111'::uuid,60)),
  'RUNNING',
  'first worker claims the job'
);
select is(
  (select attempts from public.sports_jobs where idempotency_key='part4:test:dedupe'),
  1,
  'first claim consumes one attempt'
);
select is(
  public.complete_sports_job(
    (select id from public.sports_jobs where idempotency_key='part4:test:dedupe'),
    '00000000-0000-0000-0000-000000000999'::uuid
  ),
  false,
  'worker with the wrong token cannot complete a lease'
);
select is(
  public.renew_sports_job_lease(
    (select id from public.sports_jobs where idempotency_key='part4:test:dedupe'),
    '00000000-0000-0000-0000-000000000111'::uuid,
    60
  ),
  true,
  'lease owner can renew an active lease'
);
select is(
  public.fail_sports_job(
    (select id from public.sports_jobs where idempotency_key='part4:test:dedupe'),
    '00000000-0000-0000-0000-000000000111'::uuid,
    'retry me',
    5
  ),
  'FAILED',
  'first failure schedules a retry'
);

update public.sports_jobs
set available_at=now()-interval '1 second'
where idempotency_key='part4:test:dedupe';

select is(
  (select attempts from public.claim_sports_job('00000000-0000-0000-0000-000000000222'::uuid,60)),
  2,
  'retry claim consumes the final allowed attempt'
);
select is(
  public.fail_sports_job(
    (select id from public.sports_jobs where idempotency_key='part4:test:dedupe'),
    '00000000-0000-0000-0000-000000000222'::uuid,
    'final failure',
    5
  ),
  'DEAD',
  'failure on the final attempt moves the job to DEAD'
);
select is(
  (select status from public.sports_jobs where idempotency_key='part4:test:dedupe'),
  'DEAD',
  'dead job remains terminal'
);

select lives_ok(
  $$select public.enqueue_sports_job('part4:test:terminal','TEST_TERMINAL',null,'{}'::jsonb,3)$$,
  'terminal test job can be enqueued'
);
select is(
  (select status from public.claim_sports_job('00000000-0000-0000-0000-000000000333'::uuid,60)),
  'RUNNING',
  'terminal test job is claimed'
);
select is(
  public.dead_sports_job(
    (select id from public.sports_jobs where idempotency_key='part4:test:terminal'),
    '00000000-0000-0000-0000-000000000999'::uuid,
    'must not win'
  ),
  false,
  'worker with the wrong token cannot terminalize a job'
);

update public.sports_jobs
set lease_expires_at=now()-interval '1 second'
where idempotency_key='part4:test:terminal';

select is(
  public.dead_sports_job(
    (select id from public.sports_jobs where idempotency_key='part4:test:terminal'),
    '00000000-0000-0000-0000-000000000333'::uuid,
    'expired lease must not win'
  ),
  false,
  'expired lease cannot terminalize a job'
);

update public.sports_jobs
set lease_expires_at=now()+interval '60 seconds'
where idempotency_key='part4:test:terminal';

select is(
  public.dead_sports_job(
    (select id from public.sports_jobs where idempotency_key='part4:test:terminal'),
    '00000000-0000-0000-0000-000000000333'::uuid,
    'terminal validation'
  ),
  true,
  'lease owner can terminalize an active job'
);
select is(
  (select status from public.sports_jobs where idempotency_key='part4:test:terminal'),
  'DEAD',
  'explicit terminalization persists DEAD state'
);
select is(
  (select last_error from public.sports_jobs where idempotency_key='part4:test:terminal'),
  'terminal validation',
  'explicit terminalization records the bounded error'
);

select * from finish();
rollback;
