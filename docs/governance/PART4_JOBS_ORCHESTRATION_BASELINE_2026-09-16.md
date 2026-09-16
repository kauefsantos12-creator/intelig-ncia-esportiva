# Parte 4 — baseline de jobs e orquestração

Data: 2026-09-16

Esta parte é a etapa técnica de jobs/orquestração e não deve ser confundida com a fase 4 do roadmap funcional do produto.

## Estado confirmado no runtime

- O Lovable Cloud está reconciliado até `20260916031000_sports_worker_wake.sql`.
- `sports_jobs` existe com chave de idempotência única, estados `PENDING/RUNNING/SUCCEEDED/FAILED/DEAD`, tentativas, disponibilidade e lease.
- `enqueue_sports_job`, `claim_sports_job`, `renew_sports_job_lease`, `complete_sports_job`, `fail_sports_job` e `dead_sports_job` existem no Lovable Cloud.
- `sports-intelligence-maintenance` está ativo a cada 15 minutos.
- `sports-job-worker-kick` está ativo a cada 2 minutos.
- `elo-daily-incremental` permanece ativo no período diário de sincronização do Elo.
- `elo-daily-finalize` permanece ativo às `08:05 UTC` (`05:05 America/Sao_Paulo` no offset atual).
- Crons do funil antigo (`analysis-worker-watch`, `scheduled-d2-analysis`, `analysis-run-orphan-reconcile`, `stage9-daily-lab` e `five-dollar-maintenance-daily`) foram retirados.
- A auditoria viva do Elo retornou `OK`, sem issues, sem erros de sync e sem violações hierárquicas.

## Invariantes da fila

1. **Idempotência é identidade, não atualização.** Repetir a mesma chave com o mesmo job devolve o registro já existente; reutilizar a chave para outro tipo, fixture ou payload é colisão e falha explicitamente.
2. **Tentativas são limitadas.** Um job que já consumiu `max_attempts` não pode ser reclamado novamente após falha ou expiração do lease; ele vai para `DEAD`.
3. **Lease expirado perde autoridade.** `complete_sports_job`, `fail_sports_job` e `dead_sports_job` só aceitam o token proprietário enquanto o lease continua válido.
4. **Heartbeat explícito.** `renew_sports_job_lease` permite que um worker legítimo prolongue uma execução longa sem abrir uma segunda execução concorrente.
5. **Concorrência segura.** O claim usa `FOR UPDATE SKIP LOCKED`.
6. **Terminalização cercada.** Falhas não recuperáveis só chegam a `DEAD` pelo worker que ainda possui lease válido.
7. **Regressão automatizada.** `supabase/tests/sports_intelligence/job_orchestration.test.sql` cobre idempotência, ownership do lease, retry, lease expirado, limite de tentativas, estados terminais, wake do worker e produtor diário.

## Worker e wake validados em produção

- `sports-job-worker.server.ts` reclama jobs com token único por execução e processa lotes limitados.
- O worker roteia `API_FOOTBALL_LINK` e `API_FOOTBALL_FIXTURE_DATA` para as integrações canônicas já existentes.
- O lease é renovado por heartbeat enquanto o job está em execução; resultados são descartados como `STALE` quando o fencing não confirma mais a autoridade do worker.
- A política de falha diferencia payload/job inválido, ausência temporária no provider, rate limit, falha de configuração e erro transitório, sempre respeitando `max_attempts`.
- `sports_sync_state` registra tentativa, sucesso e falha para os domínios `fixture_link` e `fixture_data`.
- `/api/sports-jobs` é uma rota `POST` dedicada e autenticada com token mantido exclusivamente no Vault do Lovable Cloud.
- `kick_sports_job_worker()` dispara a rota via `pg_net`; `sports-job-worker-kick` executa a cada 2 minutos.
- Uma chamada manual real do kick recebeu HTTP `200` da produção e retornou `claimed: 0`, `queueEmpty: true` quando a fila estava vazia.
- O cron automático também foi observado no Lovable Cloud recebendo HTTP `200` sucessivamente a cada 2 minutos, sem timeout ou erro.
- Um teste controlado de concorrência executado no Lovable Cloud, dentro de transação com rollback, comprovou que apenas o primeiro token reclama o job, token incorreto não finaliza, o proprietário renova o lease e somente o proprietário conclui o job. Nenhum dado de teste foi persistido.

## Produtor diário 5Dollar

A inspeção do runtime mostrou uma segunda lacuna: `syncFiveDollarDay()` já persistia fixtures canônicas e enfileirava `API_FOOTBALL_LINK`, mas não possuía chamador operacional. Com isso, o worker podia acordar corretamente e ainda encontrar a fila vazia indefinidamente.

O incremento `20260916033000_sports_daily_sync_cron.sql` fecha esse circuito:

- `/api/sports-daily-sync` é uma rota `POST` protegida pelo mesmo token do worker;
- a rota exige `date` em `YYYY-MM-DD` e valida em runtime se `FIVE_DOLLAR_FOOTBALL_API_KEY` e `API_FOOTBALL_KEY` estão configuradas antes de produzir jobs;
- `kick_sports_daily_sync(integer)` calcula o dia no fuso `America/Sao_Paulo`, usa advisory lock por data e dispara a rota por `pg_net` sem versionar segredos;
- `sports-daily-sync-yesterday` roda às `08:20 UTC` (`05:20 America/Sao_Paulo`) para fechar o dia anterior depois do Elo;
- `sports-daily-sync-today` roda às `08:40 UTC` (`05:40 America/Sao_Paulo`) para carregar a programação do dia;
- o produtor reutiliza `sports_worker_cron_secret` e `sports_worker_base_url` já provisionados no Vault;
- as regressões pgTAP verificam existência da função, permissões, schedules únicos e dispatch por `pg_net`.

Este produtor só deve ser considerado vivo depois de o PR correspondente ficar totalmente verde, ser mergeado, a migration ser reconciliada no Lovable Cloud e uma execução real confirmar o fluxo dos providers.

## Estado de provisionamento

Já estão provisionados no Vault do Lovable Cloud:

- `sports_worker_cron_secret`: token aleatório forte e exclusivo do worker/orquestrador;
- `sports_worker_base_url`: URL pública publicada do app.

Os valores não são expostos em documentação, logs de aplicação ou GitHub.

## Lacunas restantes para encerrar a Parte 4

A Parte 4 só deve ser encerrada depois de:

- todos os gates do PR do produtor diário ficarem verdes;
- merge do produtor diário e validação da `main` pós-merge;
- sincronização/publicação do mesmo commit no Lovable;
- aplicação de `20260916033000_sports_daily_sync_cron.sql` no Lovable Cloud;
- confirmação de `sports-daily-sync-yesterday` e `sports-daily-sync-today` únicos e ativos;
- execução real do produtor com credenciais dos providers disponíveis;
- validação ponta a ponta `5Dollar -> fixture canônica -> API_FOOTBALL_LINK -> API_FOOTBALL_FIXTURE_DATA -> dados normalizados` com pelo menos uma fixture elegível;
- auditoria final da fila garantindo ausência de idempotency keys duplicadas, `attempts > max_attempts` e leases `RUNNING` expirados.

## Gate de conclusão da Parte 4

A Parte 4 só pode ser encerrada quando migrations, pgTAP, unit tests, build e demais gates do CI estiverem verdes e o Lovable Cloud comprovar: nenhum job duplicado para a mesma chave, nenhum processamento concorrente sem lease válido, nenhum job acima de `max_attempts`, crons únicos/ativos, wake autenticado funcionando e ao menos um fluxo de job validado ponta a ponta.
