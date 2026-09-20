# Elo — auditoria do ranking atual por clube

Data: 20/09/2026

## Achado

O read-model `elo_global_team_ratings` tinha 737 linhas para 681 clubes distintos.  
56 clubes apareciam em duas ligas ao mesmo tempo porque `elo_team_ratings` preserva corretamente o rating local de cada contexto doméstico histórico.

Exemplos observados no runtime:

- West Ham: Premier League + Championship;
- Wolverhampton: Premier League + Championship;
- Mallorca: La Liga + Segunda;
- Schalke: Bundesliga II + Bundesliga I;
- Athletico Paranaense: Série B + Série A.

Não havia empate na data da partida mais recente entre as linhas duplicadas: 56/56 clubes têm um contexto doméstico atual determinístico por `last_fixture_at`.

## Correção

A tabela `elo_team_ratings` continua intacta, com uma linha por clube/liga para histórico e auditoria.

A view `elo_global_team_ratings` passa a escolher somente a linha com:

1. maior `last_fixture_at`;
2. depois maior `updated_at`;
3. depois maior `league_id` como desempate determinístico.

O Elo global continua:

`league_rating + (local_rating - 1500)`.

## Impacto

- ranking Elo deixa de duplicar clubes promovidos/rebaixados;
- consumidores como a aba Hoje passam a receber um único Elo atual por `team_id`;
- histórico local e point-in-time não são apagados nem reescritos;
- fórmula, K, mando, hierarquia e reconstrução histórica não mudam.

## Snapshot pré-correção

- 32 ligas;
- 737 linhas de time/liga;
- 681 clubes únicos;
- 56 clubes duplicados no read-model atual;
- 0 empates no `last_fixture_at` mais recente entre esses duplicados;
- auditoria diária hierárquica: `OK`;
- 32/32 ligas domésticas sincronizadas;
- 9/9 competições cross-league sincronizadas.

## Validação pós-merge

PR #58 passou pelos gates de CI, Database Security, Static diagnostics e Browser compatibility/accessibility e foi mergeado no commit `178415a18cd96bcb742df11a55e09f6c4c44c5fc`.

Após sincronização do Lovable e aplicação da migration no banco vivo:

- `elo_global_team_ratings`: 681 linhas;
- clubes distintos: 681;
- duplicidades por `team_id`: 0;
- divergências da fórmula global: 0;
- `elo_team_ratings`: 737 linhas preservadas para os mesmos 681 clubes;
- cobertura da aba Hoje após a mudança: 54/54 equipes com Elo atual.

Status: **concluído e validado em runtime**.
