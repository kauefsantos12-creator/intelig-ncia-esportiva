# Etapa 4 — Dia Zero prospectivo

A Etapa 3 foi validada com 116/116 clubes das seis ligas prioritárias com elenco fresco. A partir desta migration, o sistema adota um **Dia Zero** persistido em `sports_prospective_collection_state.day_zero_at`.

## Regra de coleta

Não há backfill histórico nesta etapa. Apenas fixtures com `kickoff_at >= day_zero_at` pertencem à janela prospectiva. O pipeline existente continua vinculando a fixture à API-Football e usa coleta por fixture: lineups, estatísticas de time já persistidas no fluxo canônico e `fixtures/players` para estatísticas individuais.

O endpoint individual player-season permanece disponível como utilitário legado, mas não é o caminho primário da Etapa 4 nem é executado pelo worker.

## Persistência e agregação

Dados individuais permanecem em `sports_fixture_player_stats`; escalações em `sports_fixture_lineups`; estatísticas de equipe em `sports_fixture_team_stats`. A view `sports_player_period_aggregates` consolida apenas partidas posteriores ao Dia Zero por jogador, equipe, competição, temporada e provider.

## Operação

O worker mantém fila, lease/fencing, idempotência, retries e quota-aware mode existentes. Nenhuma chamada em massa ou backfill é autorizado por esta etapa.
