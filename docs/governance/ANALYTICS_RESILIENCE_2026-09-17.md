# Analytics resilience — 2026-09-17

## Contexto

A superfície Analytics 2026/27 usava `sports_standings` como diretório primário de competições e equipes. No Lovable Cloud, `sports_standings` e `sports_player_season_stats` ainda podem estar vazios enquanto fixtures, elencos e estatísticas por partida já estão disponíveis. Isso fazia a ausência de uma fonte opcional esvaziar toda a experiência.

## Regra arquitetural

O catálogo navegável do Analytics deve ser derivado de dados-base de partidas (`sports_fixtures`) e enriquecido, quando disponível, por `sports_standings`.

- fixtures definem associação `competição × equipe`;
- standings enriquecem posição, campanha, pontos, forma e gols;
- `sports_team_squads` fornece elenco independentemente de standings;
- `sports_player_season_stats` é enriquecimento opcional do elenco;
- falha ou vazio em uma fonte opcional não deve derrubar os demais painéis.

## Comportamento esperado

1. `sports_standings = 0` não pode deixar o diretório de Analytics vazio se houver fixtures da temporada.
2. Competições ativas com fixtures 2026/27 continuam navegáveis.
3. Equipes presentes nos fixtures continuam selecionáveis.
4. Métricas de classificação permanecem `null` quando a classificação não existe; não devem ser inventadas.
5. Elenco pode ser exibido sem estatísticas de temporada.
6. Calendário pode ser exibido mesmo quando elenco ou stats de temporada estiverem indisponíveis.
7. A resposta de detalhe expõe disponibilidade por domínio (`squad`, `seasonStats`, `fixtures`).

## Evidência de baseline

Na inspeção de 2026-09-17, o Lovable Cloud apresentava:

- `sports_standings`: 0;
- `sports_player_season_stats`: 0;
- `sports_team_squads`: 265;
- `sports_fixture_team_stats`: 2500;
- `sports_fixture_player_stats`: 132;
- `sports_fixture_events`: 1190.

Havia fixtures 2026/27 em competições como UEFA Europa League, Spain La Liga, Copa Libertadores e Brazil Serie A, portanto o produto já possuía base suficiente para um diretório analítico navegável sem depender de standings.

## Teste de regressão

`src/lib/analytics-directory.test.ts` garante que fixtures gerem o catálogo mesmo com standings vazio e que associações repetidas entre fixtures/standings sejam deduplicadas.

## Critério de conclusão da Parte 3

A Parte 3 só pode ser considerada concluída após:

- gates de CI verdes;
- merge em `main`;
- sincronização/publicação no Lovable;
- validação funcional de uma competição com standings ausente;
- seleção de equipe e carregamento independente de calendário/elenco conforme dados realmente disponíveis.
