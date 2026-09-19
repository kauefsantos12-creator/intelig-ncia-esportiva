# Parte 1 — Jobs/API: escopo e quota de enriquecimento esportivo

Data: 2026-09-17  
Reconciliado com o escopo da Etapa 4 em 19/09/2026.

## Objetivo

Registrar as regras de governança para impedir que o pipeline de enriquecimento esportivo consuma quota da API-Football fora do escopo permitido e reduzir recorrência de jobs DEAD por rate limit.

## Evolução do escopo

O escopo inicial aceitava ligas prioritárias e competições continentais. Em 19/09/2026, após a conclusão da **Etapa 3 — Elencos (116/116)**, a regra foi estreitada para o objetivo da **Etapa 4 — coleta detalhada de jogadores**.

API_FOOTBALL_LINK e API_FOOTBALL_FIXTURE_DATA de detalhamento prospectivo só devem permanecer ativos para:

- Premier League — league 39;
- Ligue 1 — 61;
- Brasileirão Série A — 71;
- Bundesliga — 78;
- Serie A italiana — 135;
- La Liga — 140.

Copas, continentais, segundas divisões e demais torneios continuam podendo existir no catálogo/agenda e receber dados gerais da fonte primária, mas não devem consumir quota do detalhamento individual da Etapa 4.

## Regras canônicas

### 1. Enfileiramento condicionado ao escopo

src/lib/sports/five-dollar-sports-sync.server.ts consulta sports_fixture_in_api_football_scope() antes de criar API_FOOTBALL_LINK.

Invariante: uma fixture fora das seis ligas não deve gerar novo job de vínculo para detalhamento individual.

### 2. Enriquecimento consciente de quota

src/lib/sports/sports-job-worker.server.ts executa API_FOOTBALL_FIXTURE_DATA via syncApiFootballFixtureDataQuotaAware().

Quando o plano/quota não puder ser identificado com segurança, o worker degrada para FREE_LEAN em vez de assumir capacidade maior.

### 3. Reconciliação não reabre fixtures fora do escopo

requeue_unlinked_api_football_jobs() permanece condicionado a sports_fixture_in_api_football_scope().

Invariante: manutenção não pode reintroduzir jobs que o escopo atual exclui.

### 4. Jobs já enfileirados fora do novo escopo

A migration da Etapa 4 deve terminalizar jobs API_FOOTBALL_LINK e API_FOOTBALL_FIXTURE_DATA em estados ativos/retry para fixtures fora das seis ligas, sem apagar os registros históricos.

### 5. Regressão automatizada

O pgTAP deve validar pelo menos:

- Premier League dentro do escopo;
- competição continental fora do escopo da Etapa 4 detalhada;
- liga doméstica não prioritária fora do escopo;
- job in-scope permanece PENDING;
- job out-of-scope vira DEAD antes de chamada ao provider.

## Robustez do CI

Os passos de preservação de diagnósticos executam somente quando a etapa que produz o respectivo log realmente falha. Isso não relaxa gates; apenas evita falhas secundárias mascarando a causa primária.

## Critérios para merge

O PR somente pode ser mergeado quando todos os gates obrigatórios aplicáveis estiverem verdes. Implementado, testado, mergeado, sincronizado, publicado e validado em produção continuam sendo estados distintos.
