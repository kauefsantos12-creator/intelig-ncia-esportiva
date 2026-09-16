# Parte 4 — baseline de jobs e orquestração

Data: 2026-09-16

Esta parte é a etapa técnica de jobs/orquestração e não deve ser confundida com a fase 4 do roadmap funcional do produto.

## Estado confirmado no runtime

- O Lovable Cloud está reconciliado até `20260916024500_sports_job_terminal_fencing.sql`.
- `sports_jobs` existe com chave de idempotência única, estados `PENDING/RUNNING/SUCCEEDED/FAILED/DEAD`, tentativas, disponibilidade e lease.
- `enqueue_sports_job`, `claim_sports_job`, `renew_sports_job_lease`, `complete_sports_job`, `fail_sports_job` e `dead_sports_job` existem no Lovable Cloud.
- `sports-intelligence-maintenance` está ativo a cada 15 minutos.
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
7. **Regressão automatizada.** `supabase/tests/sports_intelligence/job_orchestration.test.sql` cobre idempotência, ownership do lease, retry, lease expirado, limite de tentativas e estados terminais.

## Worker implementado

- `sports-job-worker.server.ts` reclama jobs com token único por execução e processa lotes limitados.
- O worker roteia `API_FOOTBALL_LINK` e `API_FOOTBALL_FIXTURE_DATA` para as integrações canônicas já existentes.
- O lease é renovado por heartbeat enquanto o job está em execução; resultados são descartados como `STALE` quando o fencing não confirma mais a autoridade do worker.
- A política de falha diferencia payload/job inválido, ausência temporária no provider, rate limit, falha de configuração e erro transitório, sempre respeitando `max_attempts`.
- `sports_sync_state` registra tentativa, sucesso e falha para os domínios `fixture_link` e `fixture_data`.

## Wake seguro do worker

A revisão de produção mostrou que o worker existia, mas não havia nenhuma referência operacional a `runSportsJobWorker` fora do próprio módulo. Portanto, a fila não tinha um mecanismo real de wake.

A migration `20260916031000_sports_worker_wake.sql` fecha esse circuito sem versionar segredos:

- `/api/sports-jobs` é uma rota `POST` dedicada; `GET` responde `405`.
- A rota valida o Bearer token por `verify_sports_worker_cron_token(text)`, RPC executável somente por `service_role`.
- O segredo fica no Vault do Lovable Cloud com o nome `sports_worker_cron_secret`; o código não contém o valor.
- A URL base fica no Vault como `sports_worker_base_url`, evitando acoplamento da migration a uma URL de ambiente.
- `kick_sports_job_worker()` lê segredo e URL do Vault e dispara a rota por `pg_net`.
- O cron `sports-job-worker-kick` roda a cada 2 minutos e chama somente o kick; ele não contém segredo no texto de `cron.job`.
- O kick usa advisory lock para não emitir dois wakes concorrentes pela mesma execução SQL. A fila continua protegida por `SKIP LOCKED` e fencing de lease caso duas requisições cheguem simultaneamente.

## Provisionamento de produção

A migration de wake pode existir sem os segredos: nesse estado `kick_sports_job_worker()` retorna `SKIPPED` com `missing_worker_secret` ou `missing_worker_base_url`. Depois do merge verde, produção deve provisionar no Vault:

- `sports_worker_cron_secret`: token aleatório forte e exclusivo do worker;
- `sports_worker_base_url`: URL pública publicada do app, sem `/` final.

Somente após esse provisionamento o cron deve ser considerado operacionalmente validado.

## Lacunas para encerrar a Parte 4

A Parte 4 só deve ser encerrada depois de:

- merge e aplicação da migration de wake no Lovable Cloud;
- provisionamento dos dois valores no Vault;
- confirmação de `sports-job-worker-kick` único e ativo;
- chamada real da rota via `pg_net` com resposta autorizada;
- validação de concorrência/lease no runtime real;
- validação ponta a ponta `5Dollar -> fixture canônica -> API_FOOTBALL_LINK -> API_FOOTBALL_FIXTURE_DATA -> dados normalizados` quando houver fixture elegível e credenciais dos providers disponíveis;
- confirmação de que `elo-daily-finalize` continua separado e único.

## Gate de conclusão da Parte 4

A Parte 4 só pode ser encerrada quando migrations, pgTAP, unit tests, build e demais gates do CI estiverem verdes e o Lovable Cloud comprovar: nenhum job duplicado para a mesma chave, nenhum processamento concorrente sem lease válido, nenhum job acima de `max_attempts`, crons únicos/ativos, wake autenticado funcionando e ao menos um fluxo de job validado ponta a ponta.
