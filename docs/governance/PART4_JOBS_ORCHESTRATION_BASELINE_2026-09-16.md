# Parte 4 — baseline de jobs e orquestração

Data: 2026-09-16

Esta parte é a etapa técnica de jobs/orquestração e não deve ser confundida com a fase 4 do roadmap funcional do produto.

## Estado confirmado após a Parte 3

- O Lovable Cloud foi reconciliado com as migrations `20260916013000` a `20260916014550`.
- `sports_jobs` existe com chave de idempotência única, estados `PENDING/RUNNING/SUCCEEDED/FAILED/DEAD`, tentativas, disponibilidade e lease.
- `sports-intelligence-maintenance` está ativo a cada 15 minutos.
- `elo-daily-incremental` permanece ativo no período diário de sincronização do Elo.
- `elo-daily-finalize` permanece ativo às `08:05 UTC` (`05:05 America/Sao_Paulo` no offset atual).
- Crons do funil antigo (`analysis-worker-watch`, `scheduled-d2-analysis`, `analysis-run-orphan-reconcile`, `stage9-daily-lab` e `five-dollar-maintenance-daily`) foram retirados.
- A auditoria viva do Elo retornou `OK`, sem issues, sem erros de sync e sem violações hierárquicas.

## Invariantes preparadas nesta branch

1. **Idempotência é identidade, não atualização.** Repetir a mesma chave com o mesmo job devolve o registro já existente; reutilizar a chave para outro tipo, fixture ou payload é colisão e falha explicitamente.
2. **Tentativas são limitadas.** Um job que já consumiu `max_attempts` não pode ser reclamado novamente após falha ou expiração do lease; ele vai para `DEAD`.
3. **Lease expirado perde autoridade.** `complete_sports_job` e `fail_sports_job` só aceitam o token proprietário enquanto o lease continua válido.
4. **Heartbeat explícito.** `renew_sports_job_lease` permite que um worker legítimo prolongue uma execução longa sem abrir uma segunda execução concorrente.
5. **Concorrência segura.** O claim continua usando `FOR UPDATE SKIP LOCKED`.
6. **Regressão automatizada.** O conjunto `supabase/tests/sports_intelligence/job_orchestration.test.sql` cobre cron, retirada do legado, idempotência, ownership do lease, retry e estado terminal.

## Implementado nesta etapa da Parte 4

- `sports-job-worker.server.ts` reclama jobs com token único por execução e processa lotes limitados.
- O worker roteia `API_FOOTBALL_LINK` e `API_FOOTBALL_FIXTURE_DATA` para as integrações canônicas já existentes.
- O lease é renovado por heartbeat enquanto o job está em execução; resultados são descartados como `STALE` quando o fencing do lease não confirma mais a autoridade do worker.
- A política de falha diferencia payload/job inválido, ausência temporária no provider, rate limit, falha de configuração e erro transitório, sempre respeitando `max_attempts`.
- `sports_sync_state` registra tentativa, sucesso e falha para os domínios `fixture_link` e `fixture_data`.
- Static diagnostics, Database Security e CI completo passaram no HEAD que introduziu e corrigiu o worker antes desta atualização documental.

## Lacunas que ainda impedem encerrar a Parte 4

A fila já possui produtores — por exemplo, a sincronização 5Dollar cria `API_FOOTBALL_LINK` e o vínculo da API-Football cria `API_FOOTBALL_FIXTURE_DATA` — e agora existe um consumidor implementado no código. Ainda falta fechar o consumidor operacional no Lovable Cloud como um fluxo único, acordável e auditável.

A Parte 4 ainda deve:

- instalar e validar o mecanismo que acorda o worker sem produzir processamento duplicado;
- validar concorrência real com dois workers e recuperação de execução abandonada;
- validar ponta a ponta `5Dollar -> fixture canônica -> job API-Football -> dados de jogadores/partida`;
- observar o cron diário do Elo separadamente da fila esportiva, preservando `elo-daily-finalize` como finalizador único;
- validar o estado real no Lovable Cloud após merge, publicação e migrations, sem assumir que sincronização de código aplicou schema automaticamente.

## Gate de conclusão da Parte 4

A Parte 4 só pode ser encerrada quando migrations, pgTAP, unit tests, build e demais gates do CI estiverem verdes e o runtime do Lovable Cloud comprovar: nenhum job duplicado para a mesma chave, nenhum processamento concorrente sem lease válido, nenhum job acima de `max_attempts`, crons únicos/ativos e ao menos um fluxo de job validado ponta a ponta.
