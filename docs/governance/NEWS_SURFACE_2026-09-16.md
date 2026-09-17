# Noticiário — contrato de produto e dados

Data: 16/09/2026

Branch inicial: `feat/news-surface-v1`

Refino de Frontend/UX: `feat/frontend-ux-news-v1`

Estado deste documento: **a superfície base já está no produto; o refino de Frontend/UX descrito abaixo está implementado na branch e aguarda validação de CI/PR antes de qualquer merge/publicação.**

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
- `generated_at` informa o horário de geração quando disponível;
- quando não existe resenha publicada, a interface informa explicitamente essa ausência.

### Resultados recentes

- `sports_fixtures` é a fonte canônica das partidas;
- somente fixtures `FINISHED` entram no bloco de resultados;
- nomes e logos de clubes são resolvidos por `sports_teams` e competição por `sports_competitions`;
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

## UX vigente

A resenha editorial é a tarefa principal da superfície. No desktop e no mobile ela aparece antes dos blocos factuais complementares e não divide o primeiro plano com o painel de Elo.

A ordem visual é:

1. cabeçalho com horário da última leitura e ação **Atualizar**;
2. **Resenha esportiva** com estado publicada/aguardando publicação;
3. metadados de fatos considerados e horário de geração, quando disponíveis;
4. contextos e destaques editoriais sob **progressive disclosure**;
5. **Resultados recentes** agrupados pela data local;
6. **Movimentos de Elo** como contexto secundário, em coluna lateral sticky no desktop;
7. **Outros esportes**, somente quando houver resumo publicado.

Refinos aplicados:

- largura de leitura da resenha limitada a aproximadamente 78 caracteres para preservar conforto em textos longos;
- itens editoriais associados deixam de competir visualmente com a síntese e ficam dentro de `CollapsiblePanel`;
- resultados recentes usam logos reais dos clubes quando disponíveis e fallback textual quando não houver imagem;
- placares mantêm cada clube e seu gol alinhados em linhas separadas para leitura rápida no mobile;
- resultados das últimas 48 horas são agrupados em **Hoje**, **Ontem** ou data curta, usando `America/Sao_Paulo`;
- resultados e movimentos de Elo exibem contagens discretas para facilitar leitura rápida;
- o painel de Elo permanece secundário e pode ficar sticky apenas em telas largas;
- fatos editoriais, resultados e Elo continuam separados visualmente e semanticamente;
- nenhum conteúdo é criado no cliente para preencher ausência de publicação.

Loading, erro, vazio e dados carregados usam os contratos já definidos em `SurfaceState.tsx`. Horários são apresentados em `America/Sao_Paulo`, coerentes com a referência de Horário de Brasília do produto.

## Guardrails

- nenhum texto gerado no browser é apresentado como notícia;
- nenhum resultado incompleto é exibido como encerrado;
- regras de acompanhamento existentes são reutilizadas em vez de criar uma segunda lista de prioridades no frontend;
- nenhuma fonte externa é atribuída sem proveniência registrada;
- fatos editoriais e métricas calculadas permanecem visual e semanticamente distinguíveis;
- nenhuma regra de Elo, migration, job, cron, integração ou RLS é modificada por esta fatia;
- implementado, testado, mergeado, sincronizado, publicado e validado em produção continuam sendo estados distintos.
