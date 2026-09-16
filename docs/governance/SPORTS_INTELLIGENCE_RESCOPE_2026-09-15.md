# Reescopo — Motor de Inteligência Esportiva

Data: 15/09/2026

## Decisão de produto

O produto deixa de ter apostas, odds, EV, edge, stake e seleção de oportunidades como finalidade. A nova finalidade é funcionar como uma central pessoal de inteligência esportiva, com foco principal em futebol e cobertura resumida de outros esportes no noticiário.

O repositório e o projeto Lovable canônico permanecem os mesmos durante a transição. O banco/runtime continua sendo chamado de **Lovable Cloud**.

A transição será não destrutiva: fluxos e tabelas do produto anterior serão primeiro retirados da experiência principal e suas automações serão desligadas de forma governada. Exclusões físicas só serão feitas depois de uma auditoria de dependências que comprove que Elo, histórico, ingestão ou outros componentes reutilizados não dependem delas.

## Nova arquitetura funcional

### A — Noticiário

- Resenha esportiva diária como painel principal.
- Futebol em profundidade e citação dos demais esportes relevantes.
- Dados factuais de partidas vindos da 5Dollar: placar, estatísticas de time, eventos e demais campos disponíveis.
- Contexto editorial/noticioso separado dos dados estruturados.
- Painel secundário com alterações significativas de Elo.

### B — Hoje

- Lista dos jogos de futebol transmitidos no dia.
- Cada partida aparece em uma linha expansível.
- Conteúdo expandido: transmissão, forma recente, Elo, força do calendário, casa/fora, tendências ofensivas/defensivas, jogadores a observar e curiosidades determinísticas.
- O motor de sinais não usa odds nem linguagem de aposta.
- Forma recente é ajustada pela força dos adversários via Elo; vitórias e derrotas não recebem peso idêntico sem contexto.
- Métricas de ataque/defesa devem também ser expressas relativamente à média da competição para reduzir comparações enganosas entre ligas.
- Curiosidades e streaks vêm de regras calculadas sobre dados históricos; IA não deve inventar sequências.

#### Fontes de transmissão

A interface nunca depende diretamente de um agregador externo. O desenho é:

`fonte -> coletor -> normalização -> Lovable Cloud -> UI`

Prioridade inicial:

1. fonte oficial da emissora/plataforma/competição quando disponível;
2. FutNaTV;
3. agregadores complementares, como 365Scores, LiveSoccerTV ou LiveOnSat;
4. correção manual.

A persistência deve manter proveniência, horário da última checagem e confiança. Divergências entre fontes devem ser preservadas e resolvidas por prioridade, nunca ocultadas.

### C — Elo

- Rankings de clubes e ligas.
- Filtros por continente/região, país e liga, com suporte futuro a seleção múltipla e autocomplete.
- Seleção única pode usar toda a largura da página; seleções múltiplas usam blocos separados.
- Expansão de clube deve exibir histórico dos últimos 60 dias, variações e partidas que provocaram os maiores movimentos.
- Não misturar rating local da equipe com rating global sem identificar o escopo. `elo_fixture_history` contém o histórico do rating de equipe usado pelo modelo doméstico; `elo_global_team_ratings` combina rating local e rating da liga para a fotografia global atual.

### D — Analytics

- Temporada alvo inicial: 2026/27.
- Filtros: continente/região -> país -> competição (opcional) -> time.
- Visão geral consolidada e recortes por liga, copa e continental.
- Time: tabela, calendário, forma, casa/fora, ataque, defesa, força dos adversários, evolução de Elo e demais estatísticas disponíveis.
- Jogadores: elenco, participação, minutos, posição, escalação/formação, estatísticas e nota do provedor quando disponíveis.
- A nota pessoal do usuário fica separada da nota do provedor.

### E — Anotações

- Partidas concluídas e elegíveis entram em uma fila de revisão pessoal.
- Elegibilidade: jogo presente na programação de transmissão OU jogo pertencente a uma competição `always_track`.
- Escopo inicial `always_track`: Bundesliga, Ligue 1, Serie A italiana, Serie A brasileira, Premier League, La Liga e competições continentais europeias e sul-americanas.
- Se o usuário marcar que não assistiu: `watched=false`, comentário e ratings pessoais ficam `NULL` e o jogo sai da fila.
- Se assistiu: comentário opcional e avaliação de jogadores de `NULL` a `10`, inicialmente em passos de `0,5`.
- Somente atletas que efetivamente participaram entram no denominador da média pessoal do time; reserva não utilizado permanece `NULL`.
- A média do time só aparece quando todos os participantes elegíveis tiverem nota pessoal.
- O fechamento automático da virada do dia processa apenas partidas já encerradas; jogos ainda ao vivo permanecem pendentes.

## Provedores

### 5Dollar — fonte principal de futebol por time

Continuará responsável pelo que já cobre bem: fixtures, resultados, eventos, estatísticas agregadas de equipe, standings/histórico e insumos do Elo.

### API-Football — camada de jogador

O repositório já possuía um adapter API-Football genérico para fixtures e estatísticas de equipe. O reescopo acrescenta uma camada dedicada aos endpoints de:

- escalações e formação;
- jogadores da partida;
- elenco;
- temporada do jogador;
- lesões por fixture.

A configuração permanece server-side por `API_FOOTBALL_KEY`. Nenhuma chave pode chegar ao browser.

## Cálculos canônicos iniciais do painel Hoje

### Forma ajustada pela expectativa

Para cada partida, a expectativa é calculada por Elo, incluindo ajuste de mando quando aplicável. O desempenho observado usa `1` para vitória, `0,5` para empate e `0` para derrota.

`desempenho_vs_expectativa = média_ponderada(resultado_real) - média_ponderada(expectativa_elo)`

A ponderação temporal usa decaimento exponencial. Meia-vida inicial: 21 dias. O objetivo é tornar partidas recentes mais relevantes sem uma quebra arbitrária entre o jogo número 10 e o 11.

A UI deve expor os componentes (campanha, Elo médio dos adversários e diferença contra expectativa) em vez de apresentar apenas uma nota opaca.

### Normalização por competição

Para métricas como chutes no alvo, posse ou ataques perigosos:

`razão = valor_do_time / média_da_competição`

`diferença_% = razão - 1`

A métrica absoluta continua disponível, mas comparações entre ligas devem priorizar a versão relativa à competição.

### Streaks iniciais

- invencibilidade: mínimo 5;
- vitórias consecutivas: mínimo 4;
- marcando gols: mínimo 5;
- clean sheets: mínimo 3;
- sofrendo gols: mínimo 5.

Outras regras, como casa/fora e movimentos de Elo em 7/30/60 dias, serão adicionadas sobre a mesma camada determinística.

## Regras de governança da transição

- Não apagar migrations, tabelas ou histórico do produto anterior sem auditoria explícita de dependências.
- Não promover código parcial como se todas as cinco abas estivessem concluídas.
- Cada etapa continua obedecendo: `implementado != testado != mergeado != sincronizado != publicado != validado em produção`.
- Mudanças passam por branch, PR, todos os gates obrigatórios verdes e somente então merge.
- Após merge, validar sincronização com Lovable e publicação antes de declarar disponibilidade em produção.
