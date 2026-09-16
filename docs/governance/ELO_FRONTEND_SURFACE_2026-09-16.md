# Frontend + UX — Elo

Data: 16/09/2026

Branch: `feat/elo-surface-v1`

Estado: **implementado na branch e aguardando CI/PR; não mergeado nem publicado**.

## Objetivo

Transformar `/elo` em um explorer factual dos ratings já calculados pelo backend, sem duplicar fórmula ou recalcular Elo no navegador.

## Fontes canônicas

- `getEloDirectory()` → `elo_global_team_ratings` e `elo_league_ratings`;
- `getTeamEloHistory()` → `elo_fixture_history` point-in-time;
- ambos permanecem protegidos por `requireSupabaseAuth` e executam leitura privilegiada somente server-side.

## Contrato de UX

A tela oferece:

1. ranking atual de clubes por `global_rating`;
2. ranking atual de ligas por `rating`;
3. filtros progressivos por região e país;
4. busca por clube/competição;
5. seleção de clube para histórico dos últimos 60 dias;
6. distinção explícita entre **Elo global atual** e **histórico local point-in-time**;
7. indicação de ligas com `hierarchy_constrained`;
8. estados canônicos de loading, erro/retry e vazio.

## Guardrails

- nenhum rating é recalculado no frontend;
- nenhuma escrita é feita em tabelas Elo;
- o histórico não aplica informação futura a ratings passados;
- nenhuma migration, fórmula, job, cron, autenticação, sessão ou RLS é alterada;
- o frontend apenas apresenta read-models persistidos pelo backend.

Implementado, testado, mergeado, sincronizado, publicado e validado em produção continuam sendo estados distintos.
