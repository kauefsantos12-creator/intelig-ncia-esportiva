# Analytics 26/27 — contrato de frontend

Data: 16/09/2026

## Objetivo

Entregar a Etapa 5 do frontend do Motor de Inteligência Esportiva: transformar `/analytics` em uma superfície real de exploração da temporada 2026/27, usando exclusivamente dados normalizados já persistidos pelo backend.

## Escopo da V1

A superfície cobre:

1. filtros progressivos por região e país;
2. seleção de competição com dados de classificação 2026/27;
3. classificação por equipe com jogos, pontos, campanha, saldo e forma quando disponíveis;
4. seleção de equipe dentro da competição;
5. resumo da campanha da equipe;
6. elenco e jogadores com participação, titularidades, minutos e rating do provedor quando disponíveis;
7. calendário e resultados restritos à competição selecionada;
8. estados explícitos de loading, erro/retry e vazio.

## Fonte de verdade

O browser não consulta tabelas esportivas diretamente e não recalcula dados de temporada.

As leituras passam por funções autenticadas de servidor e usam `adminDb()` apenas no backend. A V1 reutiliza:

- `sports_competitions`;
- `sports_teams`;
- `sports_standings`;
- `sports_team_squads`;
- `sports_players`;
- `sports_player_season_stats`;
- `sports_fixtures`.

A classificação e as estatísticas de jogadores são snapshots persistidos. Quando houver mais de um provedor para a mesma entidade, a superfície usa o snapshot mais recente retornado pela consulta e não combina números de provedores diferentes no browser.

## Regras de leitura

- temporada canônica inicial: `2026/27`;
- detalhamento de equipe sempre mantém `competition_id` e `season` do contexto selecionado;
- calendário não mistura partidas de outras competições;
- valores ausentes são exibidos como indisponíveis, nunca inventados;
- não há cálculo de Elo, probabilidade, odds, EV ou qualquer regra do produto anterior nesta superfície;
- a camada de frontend não cria nem altera registros de Analytics.

## UX

A navegação respeita o contrato global de UI do produto:

- mobile-first;
- filtros touch-safe e progressivos;
- busca por equipe apenas dentro da competição ativa;
- tabelas densas apenas para classificação e elenco, onde a comparação tabular é superior;
- loading, vazio e erro são estados distintos;
- nenhum placeholder técnico ou dado mock é apresentado como conteúdo real.

## Segurança

`sports_standings` e `sports_player_season_stats` permanecem protegidas por RLS e leitura autenticada. O frontend usa uma fronteira server-side autenticada para manter o padrão das demais superfícies e impedir espalhamento de acesso de dados pelo browser.

## Fora do escopo

Esta V1 não:

- cria migrations;
- altera RLS;
- muda jobs, cron ou integrações;
- recalcula standings ou estatísticas;
- cria métricas derivadas que não sejam simples apresentação da campanha persistida;
- adiciona dados fictícios para preencher lacunas;
- altera modelos Elo ou de inteligência esportiva.

## Regressão obrigatória

Antes do merge devem permanecer verdes:

- lint;
- typecheck;
- architecture boundaries;
- dependency/security gates;
- governance documentation gate;
- migrations e regressões esportivas;
- testes unitários e contratos da superfície Analytics;
- build e performance budget;
- load smoke;
- Chromium, Firefox e WebKit;
- responsividade e acessibilidade automatizadas.

Implementado, testado, mergeado, sincronizado, publicado e validado em produção continuam sendo estados distintos.
