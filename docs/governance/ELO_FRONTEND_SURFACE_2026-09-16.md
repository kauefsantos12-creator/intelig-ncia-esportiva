# Frontend + UX — Elo

Data: 16/09/2026

Branch: `feat/frontend-ux-elo-v1`

Estado: **implementado na branch, protegido por teste de contrato e aguardando os gates do PR; não mergeado nem publicado**.

## Objetivo

Transformar `/elo` em um explorer factual dos ratings já calculados pelo backend, sem duplicar fórmula ou recalcular Elo no navegador, priorizando o ranking e reduzindo ruído acima da tarefa principal.

## Fontes canônicas

- `getEloDirectory()` → `elo_global_team_ratings` e `elo_league_ratings`;
- `getTeamEloHistory()` → `elo_fixture_history` point-in-time;
- ambos permanecem protegidos por `requireSupabaseAuth` e executam leitura privilegiada somente server-side.

## Contrato de UX

A tela oferece:

1. ranking atual de clubes por `global_rating` como conteúdo principal;
2. ranking atual de ligas por `rating` como modo alternativo;
3. posição global preservada mesmo quando região, país ou busca filtram a lista;
4. contador explícito de resultados visíveis sobre o universo total;
5. filtros progressivos por região e país;
6. busca por clube/competição e ação única para limpar filtros ativos;
7. seleção de clube com contexto do Elo atual e atalho explícito para o histórico dos últimos 60 dias;
8. distinção explícita entre **Elo global atual** e **histórico local point-in-time**;
9. indicação de ligas com `hierarchy_constrained`;
10. estados canônicos de loading, erro/retry e vazio;
11. indicadores gerais de cobertura movidos para contexto secundário, após ranking e histórico.

## Guardrails

- nenhum rating é recalculado no frontend;
- nenhuma escrita é feita em tabelas Elo;
- a numeração exibida nos rankings deriva da ordem canônica já entregue pelo backend;
- o histórico não aplica informação futura a ratings passados;
- nenhuma migration, fórmula, job, cron, autenticação, sessão ou RLS é alterada;
- o frontend apenas apresenta read-models persistidos pelo backend;
- logos não foram adicionados neste eixo porque `getEloDirectory()` não fornece uma fonte canônica de logo; nenhum dado visual foi inventado.

## Regressão protegida

`src/elo-surface-contract.test.ts` protege:

- autenticação e leitura server-side;
- ausência de recálculo Elo no navegador;
- ranking antes dos indicadores gerais;
- preservação da posição global após filtros;
- contador de universo, limpeza de filtros e atalho de histórico;
- estados de loading, erro/retry e vazio.

Implementado, testado, mergeado, sincronizado, publicado e validado em produção continuam sendo estados distintos.
