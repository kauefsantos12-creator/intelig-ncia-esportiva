# Noticiário — contrato de produto e dados

Data: 16/09/2026

Branch inicial: `feat/news-surface-v1`

Estado deste documento: **implementado na branch e aguardando validação de CI/PR; não mergeado nem publicado até os gates concluírem.**

## Objetivo

Transformar a superfície **Noticiário** em uma leitura factual do futebol que combine, sem misturar semânticas:

1. resenha editorial publicada no backend;
2. resultados recentes do catálogo esportivo canônico;
3. movimentos recentes de Elo já registrados no ledger point-in-time;
4. resumo de outros esportes apenas quando estiver presente em uma resenha publicada.

## Fonte de verdade

A tela não produz narrativa editorial no cliente e não inventa conteúdo para preencher ausência de dados.

### Resenha

- `sports_daily_briefings` é a fonte da síntese diária;
- somente registros `PUBLISHED` podem ser apresentados como resenha;
- `sports_briefing_items` fornece itens editoriais associados;
- `facts_through` informa até quando os fatos da publicação foram considerados;
- quando não existe resenha publicada, a interface informa explicitamente essa ausência.

### Resultados recentes

- `sports_fixtures` é a fonte canônica das partidas;
- somente fixtures `FINISHED` entram no bloco de resultados;
- nomes de clubes e competição são resolvidos por `sports_teams` e `sports_competitions`;
- o fallback factual usa janela móvel de 48 horas;
- o bloco respeita as regras `enabled + always_track` de `sports_tracking_rules`, com a mesma semântica usada por `sports_fixture_is_always_track()`;
- jogos fora do escopo de acompanhamento prioritário não são usados apenas para preencher espaço visual;
- ausência de resultados relevantes no catálogo gera estado vazio, nunca fixture mock.

### Movimentos de Elo

- `elo_fixture_history` é usado apenas para mudanças de rating já consolidadas no ledger;
- cada lado da partida gera sua própria variação (`rating_after - rating_before`);
- a superfície exibe no máximo oito movimentos, ordenados por magnitude absoluta;
- variações inferiores a 2 pontos são omitidas para reduzir ruído;
- o frontend não recalcula a fórmula Elo nem altera ratings.

## Segurança

`getNewsOverview` é um `createServerFn` protegido por `requireSupabaseAuth`. Consultas privilegiadas ao Lovable Cloud permanecem no servidor via `adminDb()`; nenhuma credencial de service role, SQL privilegiado ou acesso direto às tabelas é exposto ao browser.

## Estado atual do runtime em 16/09/2026

A inspeção do Lovable Cloud antes desta implementação encontrou:

- 0 registros em `sports_daily_briefings`;
- 0 registros em `sports_briefing_items`;
- 0 registros em `sports_match_fact_packs`;
- 51 fixtures em `sports_fixtures`;
- regras `always_track` ativas em `sports_tracking_rules` para as competições prioritárias;
- ledger Elo com movimentos recentes disponível em `elo_fixture_history`.

Consequência de produto: a primeira versão deve conseguir apresentar fatos e Elo reais mesmo antes de existir uma publicação editorial, sem chamar esse fallback de “resenha”. Se as fixtures encerradas recentes estiverem fora das regras prioritárias, o bloco de resultados permanece vazio em vez de mostrar partidas irrelevantes. O preenchimento automático das tabelas de briefing é uma responsabilidade separada do pipeline/backend editorial e não deve ser simulado no frontend.

## UX

A ordem visual é:

1. cabeçalho com horário da última leitura e ação Atualizar;
2. Resenha esportiva, quando publicada;
3. Resultados recentes relevantes;
4. Movimentos de Elo;
5. Outros esportes, somente quando houver resumo publicado.

Loading, erro, vazio e dados carregados usam os contratos já definidos em `SurfaceState.tsx`. Horários são apresentados em `America/Sao_Paulo`, coerentes com a referência de Horário de Brasília do produto.

## Guardrails

- nenhum texto gerado no browser é apresentado como notícia;
- nenhum resultado incompleto é exibido como encerrado;
- regras de acompanhamento existentes são reutilizadas em vez de criar uma segunda lista de prioridades no frontend;
- nenhuma fonte externa é atribuída sem proveniência registrada;
- fatos editoriais e métricas calculadas permanecem visual e semanticamente distinguíveis;
- nenhuma regra de Elo, migration, job, cron, integração ou RLS é modificada por esta fatia;
- implementado, testado, mergeado, sincronizado, publicado e validado em produção continuam sendo estados distintos.
