-- Diagnóstico pós-remix (somente leitura). Rodar no editor SQL do Lovable Cloud.
-- É uma consulta única que devolve UMA linha com um JSON; copie o valor inteiro e cole na conversa.
-- Não mostra valores de segredos, apenas nomes.

with
tabelas(nome) as (
  values ('sports_competitions'), ('sports_teams'), ('sports_fixtures'), ('sports_players'),
         ('sports_team_squads'), ('sports_fixture_lineups'), ('sports_broadcast_evidence'),
         ('sports_daily_briefings'), ('sports_jobs'), ('sports_tracking_rules'),
         ('elo_fixtures'), ('elo_team_ratings'), ('elo_target_leagues'), ('elo_league_ratings'),
         ('source_definitions'), ('metric_definitions')
),
contagens as (
  select jsonb_object_agg(
    nome,
    case when to_regclass('public.' || nome) is null then null
         else (xpath('/row/c/text()',
                 query_to_xml(format('select count(*) as c from public.%I', nome), false, true, '')))[1]::text::bigint
    end
  ) as v
  from tabelas
),
jobs as (
  select coalesce(jsonb_agg(jsonb_build_object('tipo', job_type, 'status', status, 'qtd', qtd) order by job_type, status), '[]') as v
  from (select job_type, status, count(*) as qtd from public.sports_jobs group by 1, 2) s
),
crons as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'nome', j.jobname, 'agenda', j.schedule, 'ativo', j.active,
           'comando', left(j.command, 120),
           'ultima_execucao', (select max(d.start_time) from cron.job_run_details d where d.jobid = j.jobid),
           'ultimo_status', (select d.status from cron.job_run_details d where d.jobid = j.jobid order by d.start_time desc limit 1)
         ) order by j.jobname), '[]') as v
  from cron.job j
),
segredos as (
  select coalesce(jsonb_agg(name order by name), '[]') as v from vault.secrets
),
usuarios as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', id, 'email', email, 'provider', raw_app_meta_data ->> 'provider',
           'criado', created_at, 'ultimo_login', last_sign_in_at) order by created_at), '[]') as v
  from auth.users
),
gatilhos as (
  select coalesce(jsonb_agg(tgname order by tgname), '[]') as v
  from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal
),
funcoes as (
  select jsonb_object_agg(f, to_regprocedure(f) is not null) as v
  from (values ('public.is_approved_app_user()'), ('public.verify_sports_worker_cron_token(text)'),
               ('public.kick_sports_job_worker()'), ('public.claim_sports_job(text,integer)'),
               ('private.approved_app_user_id()'), ('private.enforce_single_google_user()')) x(f)
),
extensoes as (
  select coalesce(jsonb_agg(extname order by extname), '[]') as v
  from pg_extension where extname in ('pg_cron', 'pg_net', 'pgcrypto', 'http', 'supabase_vault')
),
sync as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'provider', provider, 'domain', domain, 'ultima_tentativa', last_attempt_at,
           'ultimo_sucesso', last_success_at, 'erro', left(last_error, 160))
         order by last_attempt_at desc nulls last), '[]') as v
  from public.sports_sync_state
)
select jsonb_pretty(jsonb_build_object(
  'approved_user_id', (select approved_user_id from private.app_security_config where singleton),
  'contagens', (select v from contagens),
  'jobs', (select v from jobs),
  'crons', (select v from crons),
  'segredos_vault', (select v from segredos),
  'usuarios', (select v from usuarios),
  'gatilhos_auth_users', (select v from gatilhos),
  'funcoes', (select v from funcoes),
  'extensoes', (select v from extensoes),
  'sync_state', (select v from sync)
)) as diagnostico;
