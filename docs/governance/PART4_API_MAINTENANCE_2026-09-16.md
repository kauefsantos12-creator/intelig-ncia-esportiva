# Parte 4 — manutenção das APIs e fechamento operacional

Data: 2026-09-16

## Incidentes encontrados no fechamento

1. O parser numérico do runtime convertia `null` em `0` por usar `Number(null)`. Como consequência, fixtures ainda sem `api_football_fixture_id` eram interpretadas como já vinculadas e jobs `API_FOOTBALL_LINK` podiam finalizar como `SUCCEEDED` com `apiFixtureId = 0`.
2. A sincronização 5Dollar de 2026-09-16 encontrou 51 fixtures, persistiu 46 e falhou em 5. O histórico do `pg_net` comprovou que todas as cinco falhas vieram do mesmo contrato de banco: `sports_fixture_events` tinha apenas um índice UNIQUE parcial, incompatível com o `ON CONFLICT (fixture_id, provider, external_event_id)` usado pelo runtime.
3. O worker foi desativado no Lovable Cloud assim que o falso sucesso foi identificado. Ele só deve ser reativado junto da migration que acompanha a correção do parser e a recuperação dos jobs afetados.

## Correções desta entrega

- `nullableProviderNumber` preserva ausência de dados (`null`, `undefined`, string vazia) como `null`, mantendo `0` somente quando o provider realmente fornece zero.
- Os sincronizadores 5Dollar e API-Football passam a usar a conversão numérica segura.
- O índice de idempotência de `sports_fixture_events` deixa de ser parcial, tornando-se um árbitro válido para o `ON CONFLICT` do upsert.
- `requeue_unlinked_api_football_jobs()` recupera exclusivamente jobs `API_FOOTBALL_LINK` marcados como `SUCCEEDED` cuja fixture continua sem `api_football_fixture_id`, limpa tentativas/lease e devolve o job para `PENDING`.
- O detalhe das falhas parciais da sincronização 5Dollar passa a ser persistido de forma limitada em `sports_sync_state.metadata`, preservando diagnóstico sem crescimento irrestrito.

## Manutenção das APIs

A manutenção passa a ser uma operação própria e autenticada:

- rota `POST /api/sports-api-maintenance`, protegida pelo mesmo token do worker no Vault;
- health check da 5Dollar pelo endpoint de status já existente;
- health check da API-Football via `/status`, com persistência em `external_api_status_snapshots`;
- limpeza de cache externo expirado além da janela de retenção;
- recuperação dos falsos sucessos de vínculo;
- resumo da fila em `sports_sync_state` para diagnóstico;
- cron `sports-api-maintenance` uma vez por hora, evitando consumo excessivo de quota;
- `sports-job-worker-kick` volta a ser ativo somente quando esta migration final for aplicada.

## Regras operacionais

- Manutenção não substitui a sincronização diária 5Dollar; ela observa saúde, configuração e estado da fila.
- `RATE_LIMITED`, indisponibilidade transitória ou erro de provider não apagam dados já persistidos.
- Jobs continuam sujeitos a `max_attempts`, retry/backoff e fencing por lease.
- Nenhum segredo é retornado pela rota ou persistido em tabelas públicas; credenciais continuam no Vault/runtime do servidor.
- A manutenção não cria processamento paralelo fora da fila: o consumidor continua usando `FOR UPDATE SKIP LOCKED` e lease ownership.

## Critério de encerramento da Parte 4

A Parte 4 só pode ser declarada concluída após:

1. PR desta correção com todos os gates verdes;
2. merge e checks pós-merge verdes;
3. Lovable sincronizado no mesmo commit e publicação concluída;
4. migration final aplicada e registrada no Lovable Cloud;
5. worker e manutenção ativos nos crons esperados;
6. jobs falsamente concluídos reprocessados sem novo `apiFixtureId = 0`;
7. nova sincronização das cinco fixtures antes falhas sem erro de `ON CONFLICT`;
8. ao menos um fluxo real validado `5Dollar -> fixture -> API_FOOTBALL_LINK -> API_FOOTBALL_FIXTURE_DATA`;
9. ausência de job acima de `max_attempts`, execução sem lease válido ou duplicação pela mesma chave de idempotência.
