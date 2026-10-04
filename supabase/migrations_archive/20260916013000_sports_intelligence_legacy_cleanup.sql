-- Motor de Inteligência Esportiva — limpeza governada do legado de apostas.
-- Esta migration roda ao final do histórico existente e não reescreve migrations antigas.

begin;

-- 1) Parar produtores do produto anterior antes de remover suas dependências.
do $$
declare r record;
begin
  if to_regclass('cron.job') is not null then
    for r in
      select jobid
      from cron.job
      where jobname in (
        'analysis-worker-watch',
        'scheduled-d2-analysis',
        'analysis-run-orphan-reconcile',
        'stage9-daily-lab',
        'five-dollar-maintenance-daily'
      )
    loop
      perform cron.unschedule(r.jobid);
    end loop;
  end if;
end $$;

-- 2) Remover RPCs do funil anterior. Elo, auth, privacidade, governança,
-- performance e infraestrutura genérica de API permanecem. Os dois helpers Elo
-- que dependiam do ledger antigo são reconciliados em migration posterior.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and (
        lower(p.proname) ~ '(^|_)(analysis|bet|bankroll|odds?|value|decision|model|market|clv|stake|portfolio|prediction|opportun|candidate|quote|settle|selection|experimental)(_|$)|(^|_)stage[0-9]'
        or p.proname in ('kick_external_api_maintenance','kick_external_api_maintenance_when_idle')
      )
      and lower(p.proname) !~ '^elo_'
  loop
    execute format('drop function if exists %s cascade', r.signature);
  end loop;
end $$;

-- 3) Remover superfícies de banco exclusivamente ligadas ao funil anterior.
-- CASCADE retira policies/triggers/views dependentes, sem tocar no ledger Elo.
drop table if exists public.decision_opportunity_queue cascade;
drop table if exists public.final_selections cascade;
drop table if exists public.value_evaluations cascade;
drop table if exists public.user_odds cascade;
drop table if exists public.market_candidates cascade;
drop table if exists public.experimental_value_evaluations cascade;
drop table if exists public.experimental_odds_snapshots cascade;
drop table if exists public.experimental_bet_tracking cascade;
drop table if exists public.experimental_bankroll_config cascade;
drop table if exists public.experimental_analysis_results cascade;
drop table if exists public.model_predictions cascade;
drop table if exists public.model_versions cascade;
drop table if exists public.elo_prediction_context cascade;
drop table if exists public.normalized_match_stats cascade;
drop table if exists public.raw_observations cascade;
drop table if exists public.source_fetches cascade;
drop table if exists public.match_external_ids cascade;
drop table if exists public.matches cascade;
drop table if exists public.pipeline_logs cascade;
drop table if exists public.uploaded_files cascade;
drop table if exists public.analysis_draft_games cascade;
drop table if exists public.analysis_jobs cascade;
drop table if exists public.analysis_drafts cascade;
drop table if exists public.analysis_runs cascade;
drop table if exists public.five_dollar_league_priors cascade;

-- 4) Limpar catálogo/capacidades de aposta preservando fontes esportivas neutras.
delete from public.external_api_capabilities
where capability_key in ('bet365_snapshots','btts_price','corner_card_standings','odds_tick_history');

delete from public.source_definitions
where source in (
  'five_dollar_bet365_day_odds',
  'five_dollar_bet365_odds',
  'five_dollar_standings_card',
  'five_dollar_standings_corner'
);

update public.external_api_capabilities
set enabled = true,
    reason = 'Eventos e estatísticas agregadas de partida para inteligência esportiva.',
    metadata = '{}'::jsonb,
    reviewed_at = current_date
where provider = 'five_dollar' and capability_key = 'events_stats';

update public.external_api_capabilities
set enabled = true,
    reason = 'Fixtures e calendário como base operacional do Motor de Inteligência Esportiva.',
    metadata = '{}'::jsonb,
    reviewed_at = current_date
where provider = 'five_dollar' and capability_key = 'fixtures_window';

-- 5) Retirar resíduos de execução dos jobs descomissionados.
delete from public.automation_runs
where job_name in (
  'analysis-worker-watch',
  'scheduled-d2-analysis',
  'analysis-run-orphan-reconcile',
  'stage9-daily-lab',
  'five-dollar-maintenance-daily'
);

-- 6) Remover conceitos financeiros/de aposta do catálogo de métricas.
delete from public.metric_definitions
where lower(coalesce(metric_key, '')) ~ '(stake|bankroll|clv|odd|odds|edge|expected[_ -]?value|roi|hit[_ -]?rate|drawdown|model_gate)'
   or lower(coalesce(display_name, '')) ~ '(stake|banca|clv|odd|odds|edge|valor esperado|roi|taxa de acerto|drawdown|model confidence)';

-- 7) Evidência de governança do reescopo. O catálogo histórico aceita INSERT/UPDATE/DELETE.
insert into public.governance_change_log (
  table_name, record_key, operation, actor_db_role, before_data, after_data, context
) values (
  'system_scope', 'betting_engine', 'UPDATE', current_user,
  jsonb_build_object('scope', 'betting/value engine'),
  jsonb_build_object('scope', 'sports intelligence engine'),
  jsonb_build_object(
    'event', 'DECOMMISSION',
    'preserved', jsonb_build_array('elo','external_api_infra','auth','privacy','governance','performance','push'),
    'migration', '20260916013000_sports_intelligence_legacy_cleanup.sql'
  )
);

commit;
