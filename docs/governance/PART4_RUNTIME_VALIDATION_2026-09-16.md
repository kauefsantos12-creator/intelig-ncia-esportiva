# Parte 4 — Jobs e orquestração

Data de validação: 16/09/2026

PR: #162 — `fix: harden Part 4 API validation and competition scope`

Estado deste documento: **implementado na branch do PR #162 e aguardando reexecução completa dos gates. Não mergeado, não publicado e não validado em produção.**

## Objetivo

Validar o runtime esportivo de jobs e orquestração com foco em sincronização, crons, idempotência, retries, rate limit e prevenção de processamento duplicado, sem exceder a cota da API-Football.

## Escopo da API-Football

A API-Football fica restrita a:

- England Premier League;
- Germany Bundesliga I;
- Spain La Liga;
- Italy Serie A;
- France Ligue 1;
- Brazil Serie A;
- competições continentais da Europa;
- competições continentais da América do Sul.

A 5Dollar permanece com cobertura ampla; esta restrição vale somente para consumo da API-Football.

## Hardening implementado no PR #162

- jobs API-Football fora do escopo são terminalizados no Lovable Cloud antes de qualquer chamada ao provedor;
- rate limit retornado dentro de envelope HTTP 200 é tratado como indisponibilidade/rate limit;
- o worker processa um job por execução;
- a política de rate limit reconhece também `too many requests`;
- o limite distribuído começa conservador e pode ser ajustado pelos headers do provedor, mantendo margem operacional;
- a identidade das fixtures 5Dollar é normalizada antes da persistência;
- enriquecimento `API_FOOTBALL_FIXTURE_DATA` é reagendado para a janela pós-jogo;
- a manutenção da API-Football roda em frequência reduzida para preservar cota;
- testes de regressão cobrem escopo, fila, cron, lease, idempotência e quota.

## Garantias operacionais esperadas

- `sports-job-worker-kick`: uma execução por minuto;
- `sports-api-maintenance`: a cada 6 horas, no minuto 12;
- claim concorrente protegido por lock/lease e `SKIP LOCKED`;
- apenas o proprietário de lease ativa pode concluir, renovar, falhar ou terminalizar um job;
- retries são limitados e persistem o último erro de forma controlada;
- jobs `DEAD` permanecem terminais até recuperação explícita;
- idempotency keys não podem representar trabalhos semanticamente distintos;
- reexecuções e crons devem permanecer seguros contra processamento duplicado;
- RPCs operacionais sensíveis continuam indisponíveis para `anon` e `authenticated`, com execução server-side/service-role.

## Estado de validação antes deste commit documental

No HEAD `8f58017d3f509c8b0aafe954068c9fa9572b9768`:

- **Static diagnostics:** verde;
- **Database Security:** verde;
- **CI:** vermelho somente no `Governance documentation gate`;
- etapas posteriores do CI ficaram bloqueadas e, por isso, não servem como evidência de aprovação da Parte 4.

Este documento é a atualização canônica exigida pelo `Governance documentation gate` para as alterações governadas em `src/lib/sports`, `src/lib/adapters` e `supabase/migrations`.

## Rollout

O worker permanece pausado no Lovable Cloud enquanto o PR #162 estiver em validação. Nenhuma migration desta branch deve ser aplicada ao Lovable Cloud antes de todos os gates obrigatórios ficarem verdes.

Após os gates verdes, a sequência obrigatória é:

1. concluir a Parte 5 executando lint, typecheck, architecture, testes, migrations e segurança;
2. somente então fazer merge do PR;
3. confirmar o `main` resultante;
4. verificar sincronização com Lovable;
5. publicar apenas se necessário;
6. validar o runtime e o estado final no Lovable Cloud.

Implementado, testado, mergeado, sincronizado, publicado e validado em produção continuam sendo estados distintos.
