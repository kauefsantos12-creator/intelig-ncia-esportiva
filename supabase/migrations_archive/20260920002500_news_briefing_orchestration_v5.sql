-- Resenha v5 — garantir que o catálogo de ontem/hoje/amanhã esteja atualizado antes do fechamento das 05:05.
-- O worker é assíncrono; os produtores são espaçados em 15 minutos para dar margem ao sync
-- antes da publicação editorial.
begin;

do $$
declare
  r record;
begin
  if to_regclass('cron.job') is not null then
    for r in
      select jobid
      from cron.job
      where jobname in (
        'sports-daily-sync-yesterday',
        'sports-daily-sync-today',
        'sports-daily-sync-tomorrow'
      )
    loop
      perform cron.unschedule(r.jobid);
    end loop;

    -- 04:20 America/Sao_Paulo (07:20 UTC): fecha os resultados do dia anterior.
    perform cron.schedule(
      'sports-daily-sync-yesterday',
      '20 7 * * *',
      'select public.kick_sports_daily_sync(-1);'
    );

    -- 04:35 America/Sao_Paulo (07:35 UTC): atualiza a programação do dia.
    perform cron.schedule(
      'sports-daily-sync-today',
      '35 7 * * *',
      'select public.kick_sports_daily_sync(0);'
    );

    -- 04:50 America/Sao_Paulo (07:50 UTC): pré-carrega o dia seguinte para
    -- o próximo compromisso (ex.: Palmeiras) já existir no fechamento das 05:05.
    perform cron.schedule(
      'sports-daily-sync-tomorrow',
      '50 7 * * *',
      'select public.kick_sports_daily_sync(1);'
    );
  end if;
end
$$;

commit;
