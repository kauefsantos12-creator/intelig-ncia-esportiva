# Hoje — contrato de produto e dados

Data: 16/09/2026

Branch inicial: `feat/today-surface-v1`

Refino de Frontend/UX: `feat/frontend-ux-today-v1`

Estado deste documento: **a superfície base já está no produto; o refino de Frontend/UX descrito abaixo está implementado na branch e aguarda validação de CI/PR antes de qualquer merge/publicação.**

## Objetivo

Transformar a superfície **Hoje** em uma agenda factual do escopo acompanhado, com uma linha por partida e aprofundamento sob demanda.

A tela deve responder, sem fabricar dados:

1. quais jogos acompanhados existem hoje;
2. horário e status atual;
3. onde assistir, quando houver evidência registrada;
4. forma recente disponível no catálogo canônico;
5. Elo atual já consolidado no ledger.

## Fonte de verdade

### Agenda

- `sports_fixtures` fornece partidas, horário, status e placar;
- `sports_teams` fornece nomes e logos;
- `sports_competitions` fornece competição e metadados;
- `sports_tracking_rules` define o escopo prioritário;
- a filtragem replica a semântica da função `sports_fixture_is_always_track()` sem alterar sua regra.

### Transmissão

- `sports_broadcast_evidence` é a única fonte apresentada como confirmação de canal/plataforma;
- ausência de evidência é exibida como **Transmissão ainda não confirmada**;
- fonte, horário de verificação e link são exibidos quando registrados;
- o frontend não raspa FutNaTV nem qualquer site diretamente.

### Elo

- `elo_global_team_ratings` fornece o rating global atual;
- o frontend não recalcula a fórmula Elo;
- ausência de cobertura gera estado explícito.

### Forma recente

- calculada somente a partir de `sports_fixtures` com `status = FINISHED`;
- considera até cinco partidas anteriores ao kickoff do confronto;
- exibe V/E/D e gols pró/contra;
- ausência de amostra não é substituída por estimativa.

## Fuso horário

A data operacional e todos os horários da superfície usam `America/Sao_Paulo`. O read-model calcula os limites do dia local no servidor antes de consultar o Lovable Cloud.

## Estado real do Lovable Cloud em 16/09/2026

A inspeção realizada antes da implementação encontrou:

- 19 fixtures do dia dentro do escopo `always_track`;
- 0 registros em `sports_broadcast_evidence`;
- cobertura de Elo para a maior parte das equipes acompanhadas;
- 0 registros em `sports_standings`;
- 0 registros em `sports_player_season_stats`;
- 0 registros em `sports_team_squads`.

Consequência: esta versão entrega agenda, forma recente e Elo reais. A transmissão permanece com estado não confirmado enquanto o pipeline de evidências estiver vazio. Jogadores e classificação não são simulados.

## UX vigente

A agenda é a tarefa primária da superfície e deve aparecer antes dos indicadores de cobertura.

- cabeçalho com data local, horário da última leitura e ação **Atualizar**;
- agenda antes das métricas de cobertura, principalmente para reduzir deslocamento no mobile;
- filtros **Todos / Próximos / Ao vivo / Com transmissão / Encerrados**, com contagem de partidas;
- busca por clube ou competição;
- partidas em ordem de horário;
- uma linha expansível por confronto;
- resumo da partida com competição, status, horário de Brasília, logo ou fallback textual dos clubes, nomes das equipes e placar separado por time quando disponível;
- ausência de transmissão identificada sem inventar canal;
- detalhe dividido em **Momento recente**, **Elo atual** e **Onde assistir**;
- métricas de completude agrupadas em **Cobertura do dia**, abaixo da agenda;
- loading, erro, retry e estados vazios explícitos;
- alvos de toque e comportamento mobile preservam o contrato global de acessibilidade e responsividade.

O refino visual reutiliza exclusivamente dados já existentes no read-model. Não introduz métricas, partidas, logos, placares ou transmissões fictícias.

## Segurança e governança

`getTodayOverview` é um `createServerFn` protegido por `requireSupabaseAuth`. Consultas privilegiadas permanecem no servidor via `adminDb()`.

Nenhuma migration, regra de Elo, job, cron, integração, autenticação, sessão ou RLS é alterada por esta fatia.

Implementado, testado, mergeado, sincronizado, publicado e validado em produção continuam sendo estados distintos.
