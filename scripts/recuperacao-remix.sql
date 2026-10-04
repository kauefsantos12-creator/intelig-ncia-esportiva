-- Recuperação pós-remix — Motor de Inteligência Esportiva
-- ----------------------------------------------------------------------------
-- O remix copiou o esquema do banco, mas não copiou:
--   * dados de configuração inseridos pelas migrations originais;
--   * gatilhos em auth.users (trava de usuário único e minimização de dados);
--   * segredos do Vault usados pelas automações;
--   * tarefas agendadas (pg_cron).
--
-- Este script reconstrói esses itens a partir das migrations originais
-- (commit f600756~1). É idempotente: pode ser rodado mais de uma vez.
--
-- ANTES DE RODAR: troque COLE_AQUI_A_CHAVE_5DOLLAR (linha abaixo) pela sua chave
-- da 5DollarFootball. Ela fica guardada no Vault e é usada pelo Elo, que roda
-- dentro do banco. Não salve o arquivo com a chave nem faça commit dela.
--
-- Rodar inteiro no editor SQL do Lovable Cloud. O resultado é uma linha com um
-- JSON de resumo; copie e cole na conversa.
-- ----------------------------------------------------------------------------

begin;

create temporary table _recuperacao (etapa text, item text, resultado text) on commit drop;

-- ============================================================================
-- 1) Segredos do Vault
-- ============================================================================
do $$
declare
  v_base_url constant text := 'https://value-bet-engine.lovable.app';
  v_five_dollar_key constant text := 'COLE_AQUI_A_CHAVE_5DOLLAR';
  v_id uuid;
begin
  -- Segredo compartilhado entre pg_cron e as rotas /api/* do app.
  select id into v_id from vault.secrets where name = 'sports_worker_cron_secret';
  if v_id is null then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'sports_worker_cron_secret',
                                'Bearer usado pelo pg_cron para acordar as rotas /api/* do app');
    insert into _recuperacao values ('vault', 'sports_worker_cron_secret', 'criado');
  else
    insert into _recuperacao values ('vault', 'sports_worker_cron_secret', 'já existia');
  end if;

  -- URL pública do app que o banco chama.
  select id into v_id from vault.secrets where name = 'sports_worker_base_url';
  if v_id is null then
    perform vault.create_secret(v_base_url, 'sports_worker_base_url', 'URL publicada do app');
    insert into _recuperacao values ('vault', 'sports_worker_base_url', 'criado');
  else
    perform vault.update_secret(v_id, v_base_url);
    insert into _recuperacao values ('vault', 'sports_worker_base_url', 'atualizado');
  end if;

  -- Chave da 5Dollar para o Elo calculado dentro do banco.
  if v_five_dollar_key = 'COLE_AQUI_A_CHAVE_5DOLLAR' or length(v_five_dollar_key) < 8 then
    insert into _recuperacao values ('vault', 'elo_five_dollar_api_key', 'PULADO: chave não informada');
  else
    select id into v_id from vault.secrets where name = 'elo_five_dollar_api_key';
    if v_id is null then
      perform vault.create_secret(v_five_dollar_key, 'elo_five_dollar_api_key', 'Chave 5DollarFootball para o Elo');
      insert into _recuperacao values ('vault', 'elo_five_dollar_api_key', 'criado');
    else
      perform vault.update_secret(v_id, v_five_dollar_key);
      insert into _recuperacao values ('vault', 'elo_five_dollar_api_key', 'atualizado');
    end if;
  end if;
end $$;

-- ============================================================================
-- 2) Gatilhos em auth.users / auth.identities
-- ============================================================================
insert into private.app_security_config (singleton, approved_user_id)
values (true, null)
on conflict (singleton) do nothing;

do $$
begin
  if to_regprocedure('private.enforce_single_google_user()') is not null then
    drop trigger if exists enforce_single_google_user on auth.users;
    create trigger enforce_single_google_user
      before insert or update of email, raw_app_meta_data on auth.users
      for each row execute function private.enforce_single_google_user();
    insert into _recuperacao values ('auth', 'enforce_single_google_user', 'criado');
  else
    insert into _recuperacao values ('auth', 'enforce_single_google_user', 'FALTA FUNÇÃO');
  end if;

  if to_regprocedure('private.cleanup_deleted_app_user()') is not null then
    drop trigger if exists cleanup_deleted_app_user on auth.users;
    create trigger cleanup_deleted_app_user
      before delete on auth.users
      for each row execute function private.cleanup_deleted_app_user();
    insert into _recuperacao values ('auth', 'cleanup_deleted_app_user', 'criado');
  else
    insert into _recuperacao values ('auth', 'cleanup_deleted_app_user', 'FALTA FUNÇÃO');
  end if;

  if to_regprocedure('private.minimize_auth_user_metadata()') is not null then
    drop trigger if exists minimize_auth_user_metadata on auth.users;
    create trigger minimize_auth_user_metadata
      before insert or update of raw_user_meta_data on auth.users
      for each row execute function private.minimize_auth_user_metadata();
    insert into _recuperacao values ('auth', 'minimize_auth_user_metadata', 'criado');
  else
    insert into _recuperacao values ('auth', 'minimize_auth_user_metadata', 'FALTA FUNÇÃO');
  end if;

  if to_regprocedure('private.minimize_identity_metadata()') is not null then
    drop trigger if exists minimize_identity_metadata on auth.identities;
    create trigger minimize_identity_metadata
      before insert or update of identity_data on auth.identities
      for each row execute function private.minimize_identity_metadata();
    insert into _recuperacao values ('auth', 'minimize_identity_metadata', 'criado');
  else
    insert into _recuperacao values ('auth', 'minimize_identity_metadata', 'FALTA FUNÇÃO');
  end if;
end $$;

-- ============================================================================
-- 3) Dados de configuração (copiados das migrations originais)
-- ============================================================================

-- 20260908230000_hierarchical_league_elo.sql — 32 ligas domésticas do Elo
insert into public.elo_target_leagues
(league_id,league_key,league_name,country_code,region,division_level,focus_role,prior_rating,parent_league_key) values
(4160026622,'england-premier-league','England Premier League','GB-ENG','EUROPE',1,'CORE',1630,null),
(1161691669,'england-championship','England Championship','GB-ENG','EUROPE',2,'CORE',1505,'england-premier-league'),
(686337048,'germany-bundesliga','Germany Bundesliga I','DE','EUROPE',1,'CORE',1600,null),
(2408766419,'germany-2-bundesliga','Germany Bundesliga II','DE','EUROPE',2,'CORE',1475,'germany-bundesliga'),
(4212821298,'spain-la-liga','Spain La Liga','ES','EUROPE',1,'CORE',1610,null),
(3685896960,'spain-la-liga-2','Spain Segunda','ES','EUROPE',2,'CORE',1480,'spain-la-liga'),
(3405541143,'italy-serie-a','Italy Serie A','IT','EUROPE',1,'CORE',1590,null),
(2098117182,'italy-serie-b','Italy Serie B','IT','EUROPE',2,'CORE',1465,'italy-serie-a'),
(3614399544,'france-ligue-1','France Ligue 1','FR','EUROPE',1,'CORE',1560,null),
(3019278554,'france-ligue-2','France Ligue 2','FR','EUROPE',2,'CORE',1450,'france-ligue-1'),
(3118717965,'brazil-serie-a','Brazil Serie A','BR','SOUTH_AMERICA',1,'CORE',1545,null),
(522514093,'brazil-serie-b','Brazil Serie B','BR','SOUTH_AMERICA',2,'CORE',1435,'brazil-serie-a'),
(2294067630,'argentina-liga-profesional','Argentina Liga Profesional','AR','SOUTH_AMERICA',1,'CORE',1515,null),
(2939352761,'argentina-nacional-b','Argentina Nacional B','AR','SOUTH_AMERICA',2,'SUPPORT',1415,'argentina-liga-profesional'),
(650171110,'portugal-primeira-liga','Portugal Primeira Liga','PT','EUROPE',1,'CORE',1535,null),
(3795758275,'portugal-segunda-liga','Portugal Segunda Liga','PT','EUROPE',2,'SUPPORT',1425,'portugal-primeira-liga'),
(137325260,'netherlands-eredivisie','Netherlands Eredivisie','NL','EUROPE',1,'CORE',1525,null),
(3076036023,'netherlands-eerste-divisie','Netherlands Eerste Divisie','NL','EUROPE',2,'SUPPORT',1415,'netherlands-eredivisie'),
(3960966399,'belgium-pro-league','Belgium First Division A','BE','EUROPE',1,'SUPPORT',1505,null),
(2053283039,'turkey-super-lig','Türkiye Super Lig','TR','EUROPE',1,'CORE',1500,null),
(1885034716,'turkey-1-lig','Türkiye 1 Lig','TR','EUROPE',2,'SUPPORT',1405,'turkey-super-lig'),
(3962220103,'norway-eliteserien','Norway Eliteserien','NO','EUROPE',1,'SUPPORT',1465,null),
(806335738,'slovakia-super-liga','Slovakia Super Liga','SK','EUROPE',1,'SUPPORT',1425,null),
(2221499861,'usa-mls','USA MLS','US','NORTH_AMERICA',1,'CORE',1485,null),
(1989521627,'saudi-pro-league','Saudi Arabia Pro League','SA','ASIA',1,'CORE',1495,null),
(3413653140,'ecuador-ligapro-serie-a','Ecuador LigaPro Serie A','EC','SOUTH_AMERICA',1,'SUPPORT',1470,null),
(3119754895,'colombia-primera-a','Colombia Primera A','CO','SOUTH_AMERICA',1,'SUPPORT',1480,null),
(1126893247,'chile-liga-de-primera','Chile Liga de Primera','CL','SOUTH_AMERICA',1,'SUPPORT',1465,null),
(1920008143,'paraguay-division-profesional','Paraguay Division Profesional','PY','SOUTH_AMERICA',1,'SUPPORT',1455,null),
(3564886492,'peru-liga-1','Peru Liga 1','PE','SOUTH_AMERICA',1,'SUPPORT',1445,null),
(2673037034,'bolivia-primera-division','Bolivia Primera Division','BO','SOUTH_AMERICA',1,'SUPPORT',1435,null),
(3465992224,'venezuela-primera-division','Venezuela Primera Division','VE','SOUTH_AMERICA',1,'SUPPORT',1420,null)
on conflict(league_id) do update set
  league_key=excluded.league_key,league_name=excluded.league_name,country_code=excluded.country_code,
  region=excluded.region,division_level=excluded.division_level,focus_role=excluded.focus_role,
  prior_rating=excluded.prior_rating,parent_league_key=excluded.parent_league_key,active=true,updated_at=now();

-- 20260908230000_hierarchical_league_elo.sql — 9 competições continentais
insert into public.elo_cross_competitions(competition_id,competition_name,region,active) values
(2187079931,'UEFA Champions League','EUROPE',true),
(1318331555,'UEFA Champions League Qualifying','EUROPE',true),
(2629778952,'UEFA Europa League','EUROPE',true),
(2515803737,'UEFA Europa League Qualifying','EUROPE',true),
(51996766,'UEFA Conference League','EUROPE',true),
(2009834352,'UEFA Conference League Qualifying','EUROPE',true),
(3899038422,'Copa Libertadores','SOUTH_AMERICA',true),
(2455214366,'Copa Libertadores Qualification','SOUTH_AMERICA',true),
(42854782,'Copa Sudamericana','SOUTH_AMERICA',true)
on conflict(competition_id) do update set
  competition_name=excluded.competition_name,region=excluded.region,active=excluded.active;

-- 20260916014100_sports_intelligence_players_broadcasts.sql — regras da agenda "Hoje"
insert into public.sports_tracking_rules (rule_key, country_code, region, competition_kind, division_level, priority, metadata)
values
  ('always-england-top-league', 'GB-ENG', null, 'LEAGUE', 1, 100, '{"label":"Premier League"}'::jsonb),
  ('always-germany-top-league', 'DE', null, 'LEAGUE', 1, 100, '{"label":"Bundesliga"}'::jsonb),
  ('always-france-top-league', 'FR', null, 'LEAGUE', 1, 100, '{"label":"Ligue 1"}'::jsonb),
  ('always-italy-top-league', 'IT', null, 'LEAGUE', 1, 100, '{"label":"Serie A"}'::jsonb),
  ('always-spain-top-league', 'ES', null, 'LEAGUE', 1, 100, '{"label":"La Liga"}'::jsonb),
  ('always-brazil-top-league', 'BR', null, 'LEAGUE', 1, 100, '{"label":"Serie A brasileira"}'::jsonb),
  ('always-europe-continental', null, 'EUROPE', 'CONTINENTAL', null, 90, '{"label":"Competições continentais europeias"}'::jsonb),
  ('always-south-america-continental', null, 'SOUTH_AMERICA', 'CONTINENTAL', null, 90, '{"label":"Competições continentais sul-americanas"}'::jsonb)
on conflict (rule_key) do nothing;

-- 20260921123500_today_brazil_serie_b_tracking.sql — segundas divisões
insert into public.sports_tracking_rules (
  rule_key, country_code, region, competition_kind, division_level,
  competition_id, always_track, enabled, priority, metadata
)
values
  ('always-brazil-second-league',  'BR',     null, 'LEAGUE', 2, null, true, true, 100, '{"label":"Serie B brasileira"}'::jsonb),
  ('always-england-second-league', 'GB-ENG', null, 'LEAGUE', 2, null, true, true, 100, '{"label":"Championship"}'::jsonb),
  ('always-germany-second-league', 'DE',     null, 'LEAGUE', 2, null, true, true, 100, '{"label":"2. Bundesliga"}'::jsonb),
  ('always-france-second-league',  'FR',     null, 'LEAGUE', 2, null, true, true, 100, '{"label":"Ligue 2"}'::jsonb),
  ('always-italy-second-league',   'IT',     null, 'LEAGUE', 2, null, true, true, 100, '{"label":"Serie B italiana"}'::jsonb),
  ('always-spain-second-league',   'ES',     null, 'LEAGUE', 2, null, true, true, 100, '{"label":"Segunda Division"}'::jsonb)
on conflict (rule_key) do update
set country_code=excluded.country_code,
    competition_kind=excluded.competition_kind,
    division_level=excluded.division_level,
    always_track=true,
    enabled=true,
    priority=excluded.priority,
    metadata=excluded.metadata,
    updated_at=now();

-- 20260912032000_data_system_governance.sql + 20260916014500 — domínios de governança
-- (metric_definitions e source_definitions referenciam esta tabela)
insert into public.governance_domain_owners(domain,data_owner,technical_owner,approval_policy,review_cadence_days)
values
  ('sources','Product/Data Owner','Repository Maintainer','PR + CI + source catalog review',90),
  ('models','Quantitative Model Owner','Repository Maintainer','Tests + point-in-time/OOS evidence where applicable',90),
  ('elo','Quantitative Model Owner','Repository Maintainer','Elo regression/audit evidence',90),
  ('bankroll_analytics','Product/Data Owner','Repository Maintainer','Metric glossary/version update',90),
  ('security_access','System Owner','Repository Maintainer','Quarterly access review',90),
  ('schema','Data/System Owner','Repository Maintainer','Migration + database regression tests',90),
  ('sports_analytics','Product owner','Application owner','Mudanças de regra exigem teste, documentação e PR verde',90)
on conflict(domain) do nothing;

-- 20260916014500_sports_intelligence_runtime_reconciliation.sql — métricas
insert into public.metric_definitions(metric_key,definition_version,display_name,formula,population,unit,data_owner_domain,effective_from,status,notes)
values
  ('elo_rating','sports-v1','Elo','Rating Elo hierárquico vigente','Clubes e ligas cobertos','pontos Elo','elo',now(),'ACTIVE','Indicador de força relativa.'),
  ('elo_change_30d','sports-v1','Variação Elo 30d','Elo atual - Elo de 30 dias atrás','Clubes cobertos','pontos Elo','elo',now(),'ACTIVE','Movimentos significativos.'),
  ('adjusted_form','sports-v1','Momento ajustado','Resultado real menos expectativa Elo, ponderado por recência','Últimos jogos válidos','índice','sports_analytics',now(),'ACTIVE','Contextualiza a forma pela força dos adversários.'),
  ('schedule_strength','sports-v1','Força do calendário','Média do Elo dos adversários no recorte','Jogos do recorte','pontos Elo','sports_analytics',now(),'ACTIVE','Contexto de dificuldade.'),
  ('personal_player_rating','sports-v1','Minha nota','Avaliação pessoal em passos de 0,5','Participantes de partidas assistidas','0-10','sports_analytics',now(),'ACTIVE','NULL significa não avaliado.')
on conflict(metric_key,definition_version) do update set
  display_name=excluded.display_name,
  formula=excluded.formula, population=excluded.population, unit=excluded.unit,
  data_owner_domain=excluded.data_owner_domain, effective_from=excluded.effective_from,
  status=excluded.status, notes=excluded.notes;

-- 20260916014500_sports_intelligence_runtime_reconciliation.sql — capacidades de API
insert into public.external_api_capabilities(provider,capability_key,minimum_plan,enabled,reason,metadata,reviewed_at)
values
  ('api_football','lineups_players','pro',true,'Escalações, participantes, minutos, estatísticas e rating de jogadores.','{}'::jsonb,current_date),
  ('broadcast','schedule_sources','n/a',true,'Programação normalizada por prioridade de fonte.','{"priority":["official","futnatv","365scores","livesoccertv","manual"]}'::jsonb,current_date)
on conflict(provider,capability_key) do update set
  minimum_plan=excluded.minimum_plan,
  enabled=excluded.enabled,
  reason=excluded.reason,
  metadata=excluded.metadata,
  reviewed_at=excluded.reviewed_at;

-- 20260919090000_stage4_prospective_fixture_collection.sql — novo Dia Zero = agora
insert into public.sports_prospective_collection_state (singleton, day_zero_at, metadata)
values (true, now(), '{"reason":"remix_recovery","backfill":false}'::jsonb)
on conflict (singleton) do nothing;

-- 20260917193000_national_squad_backfill.sql — 6 ligas com elenco (API-Football)
insert into public.sports_competitions (
  canonical_key, name, country_code, region, competition_kind, division_level,
  season, api_football_league_id, active, metadata
)
select seed.canonical_key, seed.name, seed.country_code, seed.region, 'LEAGUE', 1,
       '2026/27', seed.league_id, true, jsonb_build_object('source','api_football','priority','national_squad_backfill')
from (values
  ('api-football:league:39:2026', 'English Premier League', 'GB-ENG', 'EUROPE', 39),
  ('api-football:league:61:2026', 'France Ligue 1', 'FR', 'EUROPE', 61),
  ('api-football:league:78:2026', 'Germany Bundesliga', 'DE', 'EUROPE', 78),
  ('api-football:league:135:2026', 'Italy Serie A', 'IT', 'EUROPE', 135),
  ('api-football:league:140:2026', 'Spain La Liga', 'ES', 'EUROPE', 140),
  ('api-football:league:71:2026', 'Brazil Serie A', 'BR', 'SOUTH_AMERICA', 71)
) as seed(canonical_key,name,country_code,region,league_id)
where not exists (
  select 1 from public.sports_competitions c
  where c.api_football_league_id = seed.league_id and c.season = '2026/27'
);

insert into _recuperacao values ('seed', 'configuração', 'aplicado');

-- ============================================================================
-- 4) Tarefas agendadas (estado final das migrations originais; horários em UTC)
-- ============================================================================
do $$
declare
  r record;
  v_fn text;
begin
  for r in
    select * from (values
      ('elo-daily-incremental',                   '*/2 6-7 * * *',  'select public.elo_sync_next_target_when_idle();'),
      ('elo-daily-finalize',                      '5 8 * * *',      'select public.elo_finalize_daily();'),
      ('privacy-retention-daily',                 '20 3 * * *',     'select public.run_privacy_retention_cleanup();'),
      ('performance-retention-daily',             '15 4 * * *',     'select public.run_performance_retention_cleanup();'),
      ('push-delivery-dispatch',                  '* * * * *',      'select public.kick_push_delivery_dispatcher();'),
      ('automation-http-reconcile',               '* * * * *',      'select public.reconcile_automation_runs(5);'),
      ('sports-intelligence-maintenance',         '*/15 * * * *',   'select public.sports_maintenance_tick();'),
      ('sports-job-worker-kick',                  '* * * * *',      'select public.kick_sports_job_worker();'),
      ('sports-api-maintenance',                  '12 */6 * * *',   'select public.kick_sports_api_maintenance();'),
      ('sports-broadcast-sync-today',             '17 */2 * * *',   'select public.enqueue_sports_broadcast_sync();'),
      ('sports-daily-sync-yesterday',             '20 7 * * *',     'select public.kick_sports_daily_sync(-1);'),
      ('sports-daily-sync-today',                 '35 7 * * *',     'select public.kick_sports_daily_sync(0);'),
      ('sports-daily-sync-tomorrow',              '50 7 * * *',     'select public.kick_sports_daily_sync(1);'),
      ('sports-recent-form-history-today',        '40 7 * * *',     'select public.enqueue_today_recent_form_backfill();'),
      ('sports-editorial-source-sync-yesterday',  '50 7 * * *',     'select public.kick_editorial_source_sync(-1);'),
      ('sports-daily-briefing-prepare-yesterday', '57 7 * * *',     'select public.prepare_sports_daily_briefing(((now() at time zone ''America/Sao_Paulo'')::date - 1));'),
      ('sports-editorial-ai-refine-yesterday',    '0 8 * * *',      'select public.kick_editorial_ai_refinement(-1);'),
      ('sports-daily-briefing-release-yesterday', '5 8 * * *',      'select public.release_sports_daily_briefing(((now() at time zone ''America/Sao_Paulo'')::date - 1));'),
      ('sports-today-refresh-day',                '*/15 9-23 * * *','select public.kick_sports_daily_sync(0);'),
      ('sports-today-refresh-late',               '*/15 0-2 * * *', 'select public.kick_sports_daily_sync(0);')
    ) as t(jobname, schedule, command)
  loop
    v_fn := substring(r.command from 'public\.([a-z_]+)\(');
    if not exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = v_fn
    ) then
      insert into _recuperacao values ('cron', r.jobname, 'PULADO: função public.' || v_fn || ' não existe');
      continue;
    end if;

    perform cron.unschedule(j.jobid) from cron.job j where j.jobname = r.jobname;
    perform cron.schedule(r.jobname, r.schedule, r.command);
    insert into _recuperacao values ('cron', r.jobname, 'agendado ' || r.schedule);
  end loop;
end $$;

-- ============================================================================
-- 5) Resumo
-- ============================================================================
select jsonb_pretty(jsonb_build_object(
  'etapas', (select jsonb_agg(jsonb_build_object('etapa', etapa, 'item', item, 'resultado', resultado)) from _recuperacao),
  'contagens', jsonb_build_object(
    'elo_target_leagues', (select count(*) from public.elo_target_leagues),
    'elo_cross_competitions', (select count(*) from public.elo_cross_competitions),
    'sports_tracking_rules', (select count(*) from public.sports_tracking_rules),
    'sports_competitions', (select count(*) from public.sports_competitions),
    'metric_definitions', (select count(*) from public.metric_definitions),
    'crons', (select count(*) from cron.job),
    'segredos_vault', (select jsonb_agg(name order by name) from vault.secrets),
    'gatilhos_auth_users', (select jsonb_agg(tgname order by tgname) from pg_trigger
                            where tgrelid = 'auth.users'::regclass and not tgisinternal)
  )
)) as recuperacao;

commit;
