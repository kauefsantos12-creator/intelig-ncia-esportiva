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

O seed usa primeiro essa camada por liga para minimizar chamadas. Depois, somente para equipes que ainda ficaram com menos de 5 partidas, usa o endpoint histórico do próprio time para completar jogos de outras competições.

No snapshot inicial, as 54 equipes estavam distribuídas em sete ligas. Após o seed por liga, 30/54 equipes já tinham 5 jogos completos e 24 ainda precisavam de complemento entre competições.

## Regra operacional

A função `enqueue_today_recent_form_backfill(date)` roda diariamente às 04:40 de São Paulo, cinco minutos depois do sync canônico da agenda do dia.

Ela:

1. lê as equipes de `get_today_tracked_fixtures(...)`;
2. identifica apenas times com menos de 5 partidas encerradas persistidas nos 90 dias anteriores;
3. agrupa esses times por `five_dollar_league_id`;
4. cria um job `FIVE_DOLLAR_RECENT_FORM_LEAGUE` por liga deficiente.

O worker usa o histórico por liga da 5Dollar, seleciona os jogos necessários por equipe e deduplica confrontos compartilhados. Em seguida identifica somente os times ainda abaixo de 5 partidas e consulta `/teams/{id}/fixtures` para completar a forma com jogos de copas ou outras competições. No snapshot, isso reduz o complemento de 54 para 24 chamadas de time.

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
6. `get_recent_team_fixtures(...)` mostrar 5 jogos para cada equipe cujo histórico esteja disponível na 5Dollar, independentemente da competição.
