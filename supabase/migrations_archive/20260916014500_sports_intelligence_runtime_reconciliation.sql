-- Motor de Inteligência Esportiva — reconciliação do runtime após retirada do funil antigo.
begin;

-- O cross-league passa a ser alimentado pelo ledger Elo e pelo catálogo esportivo;
-- não existe mais ponte por raw_observations.
drop function if exists public.elo_refresh_cross_fixtures_from_raw() cascade;

-- O Elo não deve depender da fila de analysis_jobs descomissionada.
create or replace function public.elo_sync_next_target_when_idle()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not pg_catalog.pg_try_advisory_xact_lock(pg_catalog.hashtext('elo_sync_next_target_when_idle')) then
    return pg_catalog.jsonb_build_object('status','SKIPPED','reason','already_running');
  end if;
  perform public.elo_sync_next_target();
  return pg_catalog.jsonb_build_object('status','EXECUTED','executed_at',pg_catalog.now());
end;
$$;
revoke all on function public.elo_sync_next_target_when_idle() from public, anon, authenticated;
grant execute on function public.elo_sync_next_target_when_idle() to service_role;

-- A exclusão de conta passa a remover os únicos dados pessoais específicos do
-- novo produto: anotações/notas e subscriptions de push.
create or replace function public.erase_user_application_data(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_push integer := 0;
  v_reviews integer := 0;
begin
  if p_user_id is null then raise exception 'user id is required'; end if;

  delete from public.push_subscriptions where user_id = p_user_id;
  get diagnostics v_push = row_count;

  delete from public.sports_match_reviews where owner_id = p_user_id;
  get diagnostics v_reviews = row_count;

  return pg_catalog.jsonb_build_object(
    'push_deleted', v_push,
    'reviews_deleted', v_reviews
  );
end;
$$;
revoke all on function public.erase_user_application_data(uuid) from public, anon, authenticated;
grant execute on function public.erase_user_application_data(uuid) to service_role;

-- Defesa em profundidade: dados esportivos compartilhados continuam somente para
-- o usuário autenticado autorizado, mesmo que outra conta autenticada exista.
do $$
declare t text; p text;
begin
  foreach t in array array[
    'sports_competitions','sports_teams','sports_fixtures','sports_fixture_team_stats',
    'sports_fixture_events','sports_match_fact_packs','sports_players','sports_team_squads',
    'sports_fixture_lineups','sports_fixture_player_stats','sports_injuries',
    'sports_broadcast_evidence','sports_tracking_rules','sports_sync_state',
    'sports_daily_briefings','sports_briefing_items','sports_standings','sports_player_season_stats'
  ] loop
    for p in select policyname from pg_policies where schemaname='public' and tablename=t and roles @> array['authenticated']::name[] loop
      execute format('drop policy if exists %I on public.%I', p, t);
    end loop;
    execute format('create policy %I on public.%I for select to authenticated using (private.is_authorized_app_user())', t || '_authorized_read', t);
  end loop;
end $$;

-- Reforçar owner + usuário autorizado nas superfícies pessoais.
drop policy if exists sports_match_reviews_owner_select on public.sports_match_reviews;
drop policy if exists sports_match_reviews_owner_insert on public.sports_match_reviews;
drop policy if exists sports_match_reviews_owner_update on public.sports_match_reviews;
drop policy if exists sports_match_reviews_owner_delete on public.sports_match_reviews;
create policy sports_match_reviews_owner_select on public.sports_match_reviews for select to authenticated using (private.is_authorized_app_user() and owner_id=auth.uid());
create policy sports_match_reviews_owner_insert on public.sports_match_reviews for insert to authenticated with check (private.is_authorized_app_user() and owner_id=auth.uid());
create policy sports_match_reviews_owner_update on public.sports_match_reviews for update to authenticated using (private.is_authorized_app_user() and owner_id=auth.uid()) with check (private.is_authorized_app_user() and owner_id=auth.uid());
create policy sports_match_reviews_owner_delete on public.sports_match_reviews for delete to authenticated using (private.is_authorized_app_user() and owner_id=auth.uid());

drop policy if exists sports_player_ratings_owner_select on public.sports_player_personal_ratings;
drop policy if exists sports_player_ratings_owner_insert on public.sports_player_personal_ratings;
drop policy if exists sports_player_ratings_owner_update on public.sports_player_personal_ratings;
drop policy if exists sports_player_ratings_owner_delete on public.sports_player_personal_ratings;
create policy sports_player_ratings_owner_select on public.sports_player_personal_ratings for select to authenticated using (
  private.is_authorized_app_user() and exists(select 1 from public.sports_match_reviews r where r.id=review_id and r.owner_id=auth.uid())
);
create policy sports_player_ratings_owner_insert on public.sports_player_personal_ratings for insert to authenticated with check (
  private.is_authorized_app_user() and exists(select 1 from public.sports_match_reviews r where r.id=review_id and r.owner_id=auth.uid())
);
create policy sports_player_ratings_owner_update on public.sports_player_personal_ratings for update to authenticated using (
  private.is_authorized_app_user() and exists(select 1 from public.sports_match_reviews r where r.id=review_id and r.owner_id=auth.uid())
) with check (
  private.is_authorized_app_user() and exists(select 1 from public.sports_match_reviews r where r.id=review_id and r.owner_id=auth.uid())
);
create policy sports_player_ratings_owner_delete on public.sports_player_personal_ratings for delete to authenticated using (
  private.is_authorized_app_user() and exists(select 1 from public.sports_match_reviews r where r.id=review_id and r.owner_id=auth.uid())
);

alter view public.sports_team_elo_current set (security_invoker = true);
alter view public.sports_league_elo_current set (security_invoker = true);

-- Uma única manutenção idempotente atende fila de Anotações e virada do dia.
create or replace function public.sports_maintenance_tick(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_cutoff timestamptz;
  v_enqueued integer := 0;
  v_closed integer := 0;
begin
  if not pg_catalog.pg_try_advisory_xact_lock(pg_catalog.hashtext('sports_maintenance_tick')) then
    return pg_catalog.jsonb_build_object('status','SKIPPED','reason','already_running');
  end if;

  v_owner := private.approved_app_user_id();
  if v_owner is null then
    return pg_catalog.jsonb_build_object('status','SKIPPED','reason','no_approved_user');
  end if;

  v_cutoff := pg_catalog.date_trunc('day', p_now at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
  v_enqueued := public.enqueue_finished_sports_reviews(v_owner, 500);
  v_closed := public.auto_close_sports_reviews(v_owner, v_cutoff);

  return pg_catalog.jsonb_build_object(
    'status','OK',
    'enqueued',v_enqueued,
    'auto_closed',v_closed,
    'local_cutoff',v_cutoff,
    'executed_at',p_now
  );
end;
$$;
revoke all on function public.sports_maintenance_tick(timestamptz) from public, anon, authenticated;
grant execute on function public.sports_maintenance_tick(timestamptz) to service_role;

-- Remover cron antigo se ainda existir e instalar manutenção do novo produto.
do $$
declare r record;
begin
  if to_regclass('cron.job') is not null then
    for r in select jobid from cron.job where jobname in ('five-dollar-maintenance-daily','sports-intelligence-maintenance') loop
      perform cron.unschedule(r.jobid);
    end loop;
    perform cron.schedule('sports-intelligence-maintenance','*/15 * * * *','select public.sports_maintenance_tick();');
  end if;
end $$;

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

insert into public.governance_domain_owners(domain,data_owner,technical_owner,approval_policy,review_cadence_days)
values('sports_analytics','Product owner','Application owner','Mudanças de regra exigem teste, documentação e PR verde',90)
on conflict(domain) do update set
  technical_owner=excluded.technical_owner,
  approval_policy=excluded.approval_policy,
  review_cadence_days=excluded.review_cadence_days,
  updated_at=now();

insert into public.governance_change_log(table_name,record_key,operation,actor_db_role,after_data,context)
values(
  'system_scope','sports_intelligence_runtime','UPDATE',current_user,
  jsonb_build_object('season','2026/27','maintenance','15 minutes','timezone','America/Sao_Paulo'),
  jsonb_build_object('event','RECONCILE','migration','20260916014500_sports_intelligence_runtime_reconciliation.sql')
);

commit;
