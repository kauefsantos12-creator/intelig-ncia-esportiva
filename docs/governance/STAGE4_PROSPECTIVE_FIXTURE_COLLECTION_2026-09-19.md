# Etapa 4 — Dia Zero prospectivo

A Etapa 3 foi validada com 116/116 clubes das seis ligas prioritárias com elenco fresco. A partir desta migration, o sistema adota um **Dia Zero** persistido em `sports_prospective_collection_state.day_zero_at`.

## Regra de coleta

Não há backfill histórico nesta etapa. Apenas fixtures com `kickoff_at >= day_zero_at` pertencem à janela prospectiva.

O enriquecimento detalhado via API-Football é restrito exclusivamente às seis competições que tiveram os elencos carregados e validados na Etapa 3:

- Premier League — API-Football league 39;
- Ligue 1 — 61;
- Brasileirão Série A — 71;
- Bundesliga — 78;
- Serie A italiana — 135;
- La Liga — 140.

Copas, competições continentais, segundas divisões e qualquer outra competição ficam fora do detalhamento individual da Etapa 4. Elas podem continuar existindo no catálogo e receber dados gerais pela fonte primária, mas não devem gerar `API_FOOTBALL_LINK` ou `API_FOOTBALL_FIXTURE_DATA` ativos.

Para as seis ligas, o pipeline vincula a fixture à API-Football e usa coleta por fixture: lineups, estatísticas de time já persistidas no fluxo canônico e `fixtures/players` para estatísticas individuais.

O endpoint individual player-season permanece disponível como utilitário legado, mas não é o caminho primário da Etapa 4 nem é executado pelo worker.

## Persistência e agregação

Dados individuais permanecem em `sports_fixture_player_stats`; escalações em `sports_fixture_lineups`; estatísticas de equipe em `sports_fixture_team_stats`. A view `sports_player_period_aggregates` consolida apenas partidas posteriores ao Dia Zero por jogador, equipe, competição, temporada e provider.

## Operação

O worker mantém fila, lease/fencing, idempotência, retries e quota-aware mode existentes. Jobs de detalhamento fora das seis ligas devem ser encerrados antes de qualquer chamada ao provider. Nenhuma chamada em massa ou backfill é autorizado por esta etapa.


## Reconciliação de identidade entre provedores

O teste real com Tottenham x Aston Villa expôs uma diferença de identidade entre provedores. Algumas fixtures das seis ligas usam o registro de competição da 5Dollar, enquanto a cobertura de elencos/API-Football pode existir em outro registro da mesma liga.

Consequência observada: uma fixture válida da Premier League foi marcada como fora do escopo apenas porque o registro da competição da fixture tinha `api_football_league_id = NULL`, embora seu `five_dollar_league_id` fosse o da Premier League.

A regra correta é reconhecer as seis ligas por qualquer uma das identidades canônicas aceitas:

- API-Football: 39, 61, 71, 78, 135, 140;
- 5Dollar: 4160026622, 3614399544, 3118717965, 686337048, 3405541143, 4212821298.

A reconciliação deve reabrir somente jobs prospectivos que tenham sido terminalizados especificamente pelo erro de escopo anterior, preservando histórico e respeitando tentativas/backoff.
