# Motor de Inteligência Esportiva — Backend Reset

## Objetivo

Retirar o backend de apostas e estabelecer o Lovable Cloud como base do Motor de Inteligência Esportiva antes de qualquer reconstrução de frontend/UX.

## Escopo removido

Odds, value/edge, banca, stake/CLV, decisões, modelos experimentais, stages de calibração, runs/drafts/jobs de análise e o pipeline de upload/análise do produto anterior.

## Escopo preservado

Autenticação do usuário único, privacidade, governança, push, performance, infraestrutura genérica de APIs e todo o sistema Elo (ratings, histórico, ledger, auditoria, hierarquia e jobs).

## Novo domínio canônico

- catálogo 2026/27 de competições, clubes e partidas;
- estatísticas/eventos e fact packs da 5Dollar;
- escalações, participantes, minutos, ratings, elenco e lesões via API-Football;
- evidências de transmissão multi-fonte com prioridade `official > FutNaTV > agregadores > manual`;
- regras ALWAYS_TRACK para Premier League, Bundesliga, Ligue 1, Serie A italiana, La Liga, Brasileirão Série A e continentais UEFA/CONMEBOL;
- Anotações pessoais, notas 0–10 em passos de 0,5 e média apenas quando todos os participantes forem avaliados;
- fila idempotente com lease/retry/dead state;
- standings e estatísticas individuais por competição/temporada;
- briefings e itens factuais para o futuro Noticiário.

## Runtime e automação

`elo_sync_next_target_when_idle` deixa de depender de `analysis_jobs`. A ponte cross-league por `raw_observations` é retirada. Uma manutenção idempotente a cada 15 minutos cria Anotações somente para jogos FINISHED elegíveis e autoencerra apenas partidas finalizadas antes da meia-noite local (`America/Sao_Paulo`).

## Segurança e privacidade

Dados esportivos compartilhados são read-only para o usuário autenticado autorizado e escritos apenas por backend/service role. Anotações e notas pessoais são owner-scoped. A exclusão de conta passa a apagar Anotações/notas (via cascade) e push, sem referências ao legado removido.

## Gates

As regressões de banco passam a validar o domínio novo e a ausência do legado. Os E2E exclusivos de decisão/apostas deixam de ser gates. Permanecem arquitetura/typecheck, dependências, secrets, governança, banco, unitários, build, performance, carga e matriz de browser/acessibilidade.

## Estado

Este documento descreve o alvo do branch `feat/sports-intelligence-backend-reset`. Implementado não significa mergeado, publicado ou validado no Lovable Cloud; esses estados só podem ser afirmados após os respectivos gates e verificação pós-merge.
