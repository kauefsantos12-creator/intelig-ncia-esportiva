select jsonb_pretty(jsonb_build_object(
  'sync_ontem',  public.kick_sports_daily_sync(-1),
  'sync_hoje',   public.kick_sports_daily_sync(0),
  'sync_amanha', public.kick_sports_daily_sync(1),
  'elo_bootstrap_job', (
    select cron.schedule('elo-bootstrap', '*/2 * * * *', 'select public.elo_sync_next_target_when_idle();')
  )
)) as carga_inicial;

-- Carga inicial pós-remix — etapa A (agenda + Elo).
-- Rodar no editor SQL do Lovable Cloud, DEPOIS de entrar no app com o Google.
--
-- O que faz:
--   1) pede ao app a sincronização 5Dollar de ontem, hoje e amanhã
--      (o banco chama /api/sports-daily-sync em segundo plano, via pg_net);
--   2) agenda temporariamente o Elo a cada 2 minutos (o agendamento normal só
--      roda entre 06h e 08h UTC). Ele é removido pelo status-carga.sql quando
--      todas as ligas tiverem sido sincronizadas.
--
-- As chamadas HTTP saem depois do commit. Acompanhe com scripts/status-carga.sql
-- alguns minutos depois.
