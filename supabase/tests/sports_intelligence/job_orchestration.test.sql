begin;
select plan(23);

select ok(to_regclass('public.sports_jobs') is not null, 'sports job queue exists');
select ok(to_regprocedure('public.enqueue_sports_job(text,text,uuid,jsonb,integer)') is not null, 'enqueue RPC exists');
select ok(to_regprocedure('public.claim_sports_job(uuid,integer)') is not null, 'claim RPC exists');
select ok(to_regprocedure('public.renew_sports_job_lease(uuid,uuid,integer)') is not null, 'lease renewal RPC exists');
select ok(to_regprocedure('public.complete_sports_job(uuid,uuid)') is not null, 'complete RPC exists');
select ok(to_regprocedure('public.fail_sports_job(uuid,uuid,text,integer)') is not null, 'fail RPC exists');

select ok(
  exists(select 1 from cron.job where jobname='sports-intelligence-maintenance' and active and schedule='*/15 * * * *'),
  'sports maintenance cron is active every 15 minutes'
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

select * from finish();
rollback;
