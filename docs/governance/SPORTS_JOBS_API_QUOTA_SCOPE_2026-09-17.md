# Parte 1 — Jobs/API: escopo e quota de enriquecimento esportivo

Data: 2026-09-17

## Objetivo

Registrar as regras de governança introduzidas para impedir que o pipeline de enriquecimento esportivo consuma quota da API-Football em fixtures fora do escopo permitido e para reduzir recorrência de jobs `DEAD` causados por rate limit.

## Contexto do baseline

No baseline observado no Lovable Cloud antes desta correção, a fila continha 81 jobs históricos em `DEAD`: 58 associados a `scope_excluded` e 23 associados a rate limit/HTTP 429. Esses registros históricos não são apagados por esta mudança; a recuperação seletiva de jobs viáveis deve ocorrer somente depois que as proteções deste PR estiverem mergeadas e validadas.

## Regras introduzidas

### 1. Enfileiramento condicionado ao escopo

`src/lib/sports/five-dollar-sports-sync.server.ts` passa a consultar `sports_fixture_in_api_football_scope()` antes de criar um job `API_FOOTBALL_LINK`.

Invariante: uma fixture fora do escopo de enriquecimento da API-Football não deve gerar novo job de vínculo para esse provedor.

### 2. Enriquecimento consciente de quota

`src/lib/sports/sports-job-worker.server.ts` passa a executar `API_FOOTBALL_FIXTURE_DATA` por meio de `syncApiFootballFixtureDataQuotaAware()`.

Quando o plano/quota do provedor não puder ser identificado com segurança, o worker deve degradar para o modo conservador `FREE_LEAN` em vez de assumir capacidade maior e ampliar o consumo de requests.

### 3. Reconciliação não deve reabrir fixtures fora do escopo

A migration `supabase/migrations/20260917143000_sports_job_scope_quota_reconciliation.sql` restringe `requeue_unlinked_api_football_jobs()` às fixtures para as quais `sports_fixture_in_api_football_scope()` retorna verdadeiro.

Invariante: a rotina de manutenção não pode reintroduzir na fila jobs que o próprio escopo operacional exclui.

### 4. Regressão automatizada

`supabase/tests/sports_intelligence/api_maintenance.test.sql` passa a verificar explicitamente que `requeue_unlinked_api_football_jobs()` contém a proteção de escopo.

## Robustez do CI

Os passos de preservação de diagnósticos do workflow devem executar somente quando a etapa que produz o respectivo arquivo de log realmente falhar. Uma falha anterior que faça `Architecture and static quality gates` ou `Unit tests` serem pulados não deve criar uma segunda falha artificial por ausência de `architecture-check.log` ou `unit-tests.log`.

Essa alteração não relaxa nenhum gate de qualidade: ela apenas impede que a coleta de artefatos mascare a causa primária de uma execução falha.

## Critérios para merge

O PR somente pode ser mergeado quando os gates obrigatórios aplicáveis estiverem verdes, incluindo arquitetura/static quality, vulnerabilidades, secret scan, governança, route tree, migrations/regressões, unit tests, build, performance/load smoke e browser compatibility/accessibility.

Implementado, testado, mergeado, publicado e validado em produção permanecem estados distintos. A aprovação deste PR não implica publicação ou validação em produção.
