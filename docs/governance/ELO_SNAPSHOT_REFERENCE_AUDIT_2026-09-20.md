# Elo — auditoria de atualização e referência temporal

Data: 20/09/2026

## Objetivo

Validar se o ranking Elo exibido na aba `/elo` representa corretamente o estado temporal do modelo e se a interface diferencia o horário de abertura da página do horário real de processamento do Elo.

## Runtime observado

A rotina operacional permaneceu coerente com o runbook:

- `elo-daily-incremental`: 03:00–04:58 de Brasília;
- `elo-daily-finalize`: 05:05 de Brasília;
- status do finalize: `OK`;
- ligas domésticas: 32/32;
- competições cross-league: 9/9;
- última fixture Elo: 19/09/2026 23:30:22 de Brasília;
- última fixture elegível antes do fechamento: 19/09/2026 23:30:22 de Brasília;
- lag entre catálogo elegível e Elo processado: 0 minuto.

O snapshot é, portanto, diário e fechado. Jogos encerrados depois das 05:05 entram no processamento seguinte.

## Problema de UX/semântica

`getEloDirectory()` retornava `generatedAt: new Date().toISOString()`.

Esse valor representava apenas o instante em que a página era consultada, não o instante em que o Elo havia sido recalculado. A tela também mostrava apenas “Modelo atual”, sem indicar:

- quando o snapshot foi fechado;
- até qual partida os ratings estavam processados;
- se a rodada diária havia concluído todos os alvos.

## Correção

`getEloDirectory()` passa a consultar `elo_sync_state` e expor:

- `snapshot.status`;
- `snapshot.completedAt`;
- `snapshot.latestTeamFixtureAt`;
- `snapshot.domesticCurrent/domesticTargets`;
- `snapshot.crossCurrent/crossTargets`;
- cadência explícita `DAILY_0505_AMERICA_SAO_PAULO`.

O horário da requisição permanece disponível apenas como `requestedAt`, sem semântica de atualização do modelo.

A UI passa a exibir:

1. horário real do snapshot fechado;
2. última partida considerada;
3. cobertura da rodada;
4. aviso explícito de que partidas posteriores entram no fechamento seguinte das 05:05 de Brasília.

## Não alterado

- fórmula Elo;
- K;
- vantagem de mando;
- hierarquia;
- jobs e horários do cron;
- reconstrução point-in-time;
- tabelas de rating;
- histórico de fixtures.

## Critério de conclusão

O item 2 só pode ser marcado como concluído após gates verdes, merge, sincronização do Lovable e revalidação do runtime mantendo o finalize `OK` e a cobertura 32/32 + 9/9.


## Validação pós-merge

PR #60 foi mergeado no commit `7411b8d8600d91db03f94bb30fcc7630a56a76af`.

Gates finais:
- Static diagnostics: sucesso;
- CI/test-and-build: sucesso;
- Browser compatibility/accessibility: sucesso;
- o primeiro attempt do CI falhou apenas porque `registry.npmjs.org` fechou a conexão durante `bun audit`; o rerun do mesmo commit passou sem alteração de código.

Após sincronização do Lovable:
- `latest_commit_sha`: `7411b8d8600d91db03f94bb30fcc7630a56a76af`;
- projeto: `ready`;
- `is_published=true`;
- finalize Elo: `OK`;
- fechamento: 20/09/2026 05:05:00 de Brasília;
- cobertura: 32/32 ligas domésticas e 9/9 cross-league;
- última fixture Elo: 19/09/2026 23:30:22;
- última fixture elegível antes do fechamento: 19/09/2026 23:30:22;
- lag: 0 minuto.

A chamada manual de deploy retornou `pending` (deployment `fdaeaab7-4246-4bad-afe8-6172eba00b14`). Esse deployment específico não é classificado como concluído enquanto a API não confirmar.

Status do item 2: **concluído e validado no runtime**.
