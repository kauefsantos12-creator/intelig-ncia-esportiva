# Aba Hoje — seed de histórico para forma recente

Data: 20/09/2026

## Problema vivo encontrado

Depois da correção da consulta da forma recente, o runtime confirmou que o gargalo seguinte não era mais seleção de dados, e sim ausência de histórico persistido.

No snapshot:

- 54 equipes apareciam na agenda acompanhada;
- 19 tinham pelo menos um jogo anterior persistido na janela de 90 dias;
- nenhuma possuía 5 jogos armazenados;
- a consulta nova não omitia nenhuma equipe com histórico existente.

Portanto, a forma recente continuaria incompleta mesmo com a RPC correta se o sistema apenas esperasse o histórico crescer organicamente a partir do Dia Zero.

## Fonte escolhida

A 5Dollar já expõe histórico de fixtures por liga. As 54 equipes do snapshot estavam distribuídas em apenas 7 ligas acompanhadas.

O seed usa essa camada por liga, não uma chamada por time:

- Brasileirão Série A;
- Championship;
- Premier League;
- Ligue 1;
- Bundesliga;
- Serie A italiana;
- La Liga.

## Regra operacional

A função `enqueue_today_recent_form_backfill(date)` roda diariamente às 04:40 de São Paulo, cinco minutos depois do sync canônico da agenda do dia.

Ela:

1. lê as equipes de `get_today_tracked_fixtures(...)`;
2. identifica apenas times com menos de 5 partidas encerradas persistidas nos 90 dias anteriores;
3. agrupa esses times por `five_dollar_league_id`;
4. cria um job `FIVE_DOLLAR_RECENT_FORM_LEAGUE` por liga deficiente.

O worker usa o histórico por liga da 5Dollar, seleciona apenas os últimos 5 jogos necessários por equipe e deduplica confrontos compartilhados.

## Limite de escopo

Este seed existe exclusivamente para contexto pré-jogo da aba Hoje.

Ele persiste apenas:

- competição;
- equipes;
- fixture;
- kickoff;
- status;
- placar;
- IDs de provedor necessários à reconciliação básica.

Ele **não** persiste retrospectivamente:

- lineups;
- estatísticas individuais de jogadores;
- injuries;
- fact packs históricos;
- eventos detalhados;
- jobs API-Football de enriquecimento.

Assim, o seed não altera a regra de Dia Zero da coleta prospectiva detalhada da Etapa 4.

## Critério de conclusão

A frente só é concluída quando:

1. testes unitários, contrato, pgTAP, CI e Database Security estiverem verdes;
2. PR mergeado e Lovable sincronizado;
3. migration ativa no Lovable Cloud;
4. enqueuer real gerar os jobs das ligas deficientes;
5. jobs concluírem com sucesso;
6. `get_recent_team_fixtures(...)` mostrar cobertura de até 5 jogos para cada equipe cujo provedor disponha desse histórico.
