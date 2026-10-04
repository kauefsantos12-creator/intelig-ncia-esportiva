with
elo as (
  select count(*) filter (where last_synced_at is not null) as sincronizadas,
         count(*) as total,
         jsonb_agg(jsonb_build_object('liga', league_key, 'status', last_sync_status, 'erro', left(last_sync_error, 160)))
           filter (where last_sync_status is distinct from 'OK' and last_synced_at is not null) as com_problema
  from public.elo_target_leagues where active
),
removido as (
  select cron.unschedule(j.jobid) as ok
  from cron.job j, elo
  where j.jobname = 'elo-bootstrap' and elo.sincronizadas = elo.total
    and not exists (select 1 from public.elo_cross_competitions c where c.active and c.last_synced_at is null)
)
select jsonb_pretty(jsonb_build_object(
  'agora_utc', now(),
  'usuario_aprovado', (select approved_user_id is not null from private.app_security_config where singleton),
  'contagens', jsonb_build_object(
    'competitions', (select count(*) from public.sports_competitions),
    'teams', (select count(*) from public.sports_teams),
    'fixtures', (select count(*) from public.sports_fixtures),
    'fixtures_hoje', (select count(*) from public.sports_fixtures
                      where (kickoff_at at time zone 'America/Sao_Paulo')::date = (now() at time zone 'America/Sao_Paulo')::date),
    'players', (select count(*) from public.sports_players),
    'squads', (select count(*) from public.sports_team_squads),
    'broadcasts', (select count(*) from public.sports_broadcast_evidence),
    'elo_fixtures', (select count(*) from public.elo_fixtures),
    'elo_team_ratings', (select count(*) from public.elo_team_ratings)
  ),
  'elo', (select jsonb_build_object('ligas_sincronizadas', sincronizadas, 'total', total, 'com_problema', com_problema) from elo),
  'elo_continentais', (select jsonb_build_object(
                         'sincronizadas', count(*) filter (where last_synced_at is not null),
                         'total', count(*),
                         'com_problema', jsonb_agg(jsonb_build_object('competicao', competition_name, 'status', last_sync_status,
                                                                      'erro', left(last_sync_error, 160)))
                                         filter (where last_sync_status is distinct from 'OK' and last_synced_at is not null))
                       from public.elo_cross_competitions where active),
  'elo_execucoes', (select coalesce(jsonb_agg(x), '[]') from (
                      select jsonb_build_object('quando', d.start_time, 'status', d.status,
                                                'msg', left(d.return_message, 300)) as x
                      from cron.job_run_details d join cron.job j on j.jobid = d.jobid
                      where j.jobname in ('elo-bootstrap', 'elo-daily-incremental')
                      order by d.start_time desc limit 5) e),
  'elo_bootstrap_removido', exists (select 1 from removido),
  'jobs', (select coalesce(jsonb_agg(jsonb_build_object('tipo', job_type, 'status', status, 'qtd', qtd, 'ultimo_erro', erro)), '[]')
           from (select job_type, status, count(*) as qtd, left(max(last_error), 160) as erro
                 from public.sports_jobs group by 1, 2 order by 1, 2) s),
  'http_recentes', (select coalesce(jsonb_agg(x), '[]') from (
                      select jsonb_build_object('quando', created, 'status', status_code,
                                                'erro', error_msg, 'resposta', left(content, 200)) as x
                      from net._http_response order by created desc limit 8) r),
  'crons_com_falha', (select coalesce(jsonb_agg(jsonb_build_object('nome', j.jobname, 'quando', d.start_time,
                                                                   'msg', left(d.return_message, 200))), '[]')
                      from cron.job_run_details d join cron.job j on j.jobid = d.jobid
                      where d.status = 'failed' and d.start_time > now() - interval '30 minutes'),
  'sync_state', (select coalesce(jsonb_agg(jsonb_build_object('provider', provider, 'domain', domain,
                                                              'sucesso', last_success_at, 'erro', left(last_error, 160))
                                           order by last_attempt_at desc nulls last), '[]')
                 from public.sports_sync_state)
)) as status;

-- Status da carga e das automações (pode rodar quantas vezes quiser).
-- Rodar inteiro no editor SQL do Lovable Cloud e colar o JSON na conversa.
-- Efeito colateral único: remove o cron temporário 'elo-bootstrap' quando
-- todas as ligas do Elo já tiverem sido sincronizadas ao menos uma vez.
