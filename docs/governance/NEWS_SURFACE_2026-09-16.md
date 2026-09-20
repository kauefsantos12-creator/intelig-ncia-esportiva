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


## Pipeline editorial factual — 19/09/2026

A ausência de resenhas deixou de ser tratada apenas como estado de frontend. A geração diária passa a ter uma função server-side versionada, `publish_sports_daily_briefing(date)`, que recompõe idempotentemente o briefing da data a partir de partidas `FINISHED` do escopo `enabled + always_track` que já possuam `sports_match_fact_packs`.

A função grava `sports_briefing_items` com proveniência explícita do fact pack e publica `sports_daily_briefings` somente quando existem partidas elegíveis. A síntese automática é factual e determinística: placar e estatísticas persistidas; ela não atribui opinião, causalidade ou notícia externa que não esteja registrada. Sem partidas elegíveis, o briefing permanece `READY` sem síntese, preservando o estado vazio honesto no frontend.

A migration executa uma primeira publicação para a data corrente. Automação recorrente deve chamar a mesma função, preservando idempotência por `briefing_date`.


## Automação v2 — 19/09/2026

A publicação factual diária passa a executar automaticamente às 05:55 de Brasília para o dia anterior, depois do sync diário das 05:20. O escopo editorial inclui 1ª/2ª divisões de Inglaterra, Alemanha, França, Itália, Espanha e Brasil; continentais de Europa/América do Sul; primeira divisão argentina; MLS; liga saudita quando catalogada; copas nacionais prioritárias quando catalogadas; e partidas internacionais catalogadas. A seleção continua exigindo fixture FINISHED + fact pack persistido e mantém proveniência por item. A função permanece idempotente e recompõe a data antes de publicar.


## Resenha editorial v3 — 19/09/2026

A resenha passa a ter contrato estruturado em `sports_daily_briefings.editorial_payload`. O payload registra a política de fontes e as seções de abertura, Palmeiras, destaques, regra de jogos após 21h, outros esportes e programação do dia seguinte. O frontend apresenta a resenha como artigo, e não como placarão.

A publicação automática continua estritamente factual: partidas só entram com fixture `FINISHED` e fact pack persistido. Conteúdo jornalístico externo, recordes, declarações e causalidade só podem entrar após ingestão com proveniência (URL + horário de consulta); a aplicação não inventa esses trechos. Estatísticas só são atribuídas a uma fonte específica quando essa proveniência estiver registrada. A seção Palmeiras consulta explicitamente o clube e a agenda usa fixtures do dia seguinte, anexando `sports_broadcast_evidence` quando disponível.

O fechamento diário roda às 05:05 de Brasília via cron UTC 08:05. O campo `facts_through` passa a considerar apenas os fact packs efetivamente incluídos na resenha, eliminando o vazamento semântico de partidas fora do escopo editorial.


## Resenha editorial v4 — fechamento de aceitação

A v4 transforma o scaffold factual da v3 em uma leitura editorial estruturada sem atribuir a terceiros dados que ainda não possuem proveniência específica. A abertura passa a resumir volume e maiores placares do recorte; cada destaque usa placar, competição e cronologia de gols persistida. Estatísticas do fact pack 5Dollar deixam de ser apresentadas como se fossem SofaScore. O contrato exige proveniência SofaScore antes de qualquer número editorial ser atribuído a essa fonte.

A seção **Palmeiras** é fixa e deriva do catálogo canônico: registra jogos do dia e o próximo compromisso disponível nos sete dias seguintes. A seção **Ontem após 21h** usa a hora local de Brasília registrada na fixture. A **Programação de hoje** é filtrada pelo mesmo escopo editorial usado na resenha, evitando despejar ligas irrelevantes; evidências de transmissão vêm de `sports_broadcast_evidence` e o estado da fonte FutNaTV é exposto como READY, ERROR ou NEVER, sem interpretar ausência de evidência como ausência de transmissão.

O frontend recebe apenas uma projeção tipada e serializável do `editorial_payload` (agenda + estado da fonte), preservando a fronteira server-side. Conteúdo jornalístico externo, recordes, declarações, repercussão e outros esportes continuam bloqueados até existir ingestão com URL e horário de consulta persistidos.


## Orquestração v5 — dados prontos antes das 05:05

O fechamento das 05:05 passa a depender de três pré-cargas 5Dollar executadas antes da publicação: dia anterior às 04:20, dia corrente às 04:35 e dia seguinte às 04:50 (America/Sao_Paulo). Isso corrige a ordem anterior, na qual o briefing podia rodar antes do refresh de resultados e agenda. A pré-carga de amanhã garante que o próximo compromisso do Palmeiras já possa ser resolvido no fechamento, sem depender de uma sincronização manual.

No frontend, quando a publicação corresponde exatamente ao dia anterior observado em Brasília, o título passa a usar **“Resenha de ontem — <data por extenso>”**; publicações históricas continuam usando “Resenha de <data>”.


## Estatísticas editoriais SofaScore v6

A resenha passa a aceitar números editoriais somente quando existe evidência persistida do SofaScore. O runtime consulta a agenda pública diária do provedor, faz matching conservador entre evento externo e fixture canônica e busca `/event/{id}/statistics` apenas para até 12 partidas prioritárias do recorte editorial. O resultado é persistido em `sports_editorial_source_evidence`, tabela server-only com RLS, URL consultada, horário de coleta, identificador externo, confiança do matching e payload bruto/curado.

A publicação diária continua sendo gerada a partir do motor canônico. Depois da geração factual, `apply_sports_editorial_evidence(date)` acrescenta exclusivamente as métricas cuja proveniência SofaScore existe: xG, finalizações no alvo, posse, escanteios e total de finalizações quando disponíveis. Fact packs 5Dollar continuam úteis para placar e cronologia factual, mas não são rotulados como SofaScore.

A coleta SofaScore roda às 04:42 de Brasília (07:42 UTC), depois do refresh canônico de ontem e antes da publicação das 05:05. O endpoint de sync é server-side, protegido pelo mesmo token de cron do motor e não é exposto a `anon` ou `authenticated`. Ausência, ambiguidade ou falha do provedor não produz números sintéticos: a resenha permanece sem a métrica correspondente.


### Correção de matching — 20/09/2026

O matching de clubes do sync SofaScore normaliza aliases comuns antes de comparar fixtures. Em particular, `München` e `Munich` passam a convergir para o mesmo nome canônico; `New York`/ `NY` e prefixos de clube como `FC`/ `SE` continuam normalizados. O teste exige equivalência exata nesses aliases e mantém rejeição de clubes diferentes.


## Estatísticas editoriais por provedor v7

O SofaScore deixa de ser dependência operacional obrigatória da Resenha. O backend detectou challenge HTTP 403 nos endpoints de estatísticas do provedor, então o cron automático SofaScore foi desativado para evitar falha recorrente. A infraestrutura de evidência permanece disponível para uso futuro ou ingestão assistida.

A Resenha passa a usar estatísticas do 5DollarFootballAPI já persistidas nos fact packs como fallback operacional, sempre com atribuição explícita ao provedor. O conjunto aceito nesta etapa inclui finalizações no alvo, posse e escanteios; ataques e ataques perigosos permanecem disponíveis no payload para extensões futuras. xG não é inferido nem sintetizado: só aparece quando uma fonte persistida realmente o fornecer.

A API-Football permanece como fonte complementar para estatísticas e detalhamento de fixtures já vinculadas, mas não é usada como dependência primária desta resenha devido à cota/minute rate limit já observada no runtime. A regra editorial fica: usar o melhor dado persistido disponível, identificar a fonte e nunca renomear um número de um provedor como se viesse de outro.


## Resenha retrospectiva v8 — apenas o dia esportivo anterior

A Resenha deixa de carregar programação do dia corrente e qualquer informação de transmissão. Agenda e onde assistir pertencem à aba **Hoje**. A seção fixa do Palmeiras também passa a falar somente do que ocorreu no dia encerrado; próximo compromisso não é mais parte da Resenha.

O fechamento ganha uma camada editorial persistida antes das 05:05. Às 04:55 de Brasília, o backend consulta feeds jornalísticos esportivos e persiste evidências em `sports_editorial_source_evidence`. Para futebol, o matching com a fixture canônica é conservador e cada contexto mantém fonte, URL, horário de publicação, horário de coleta e confiança. A publicação usa no máximo duas evidências jornalísticas por partida e nunca altera placar, cronologia ou estatísticas canônicas.

Fontes configuradas nesta versão: ge para Brasil, Sky Sports para Inglaterra, kicker para Alemanha, L'Équipe para França, AS para Espanha e La Gazzetta dello Sport para Itália. Quando uma fonte não oferece um feed direto estável, a descoberta usa Google News RSS restrito ao domínio; a origem exibida continua sendo o veículo jornalístico. Falhas individuais são best effort e não impedem o fechamento factual.

Outros esportes passam a ter evidência própria `OTHER_SPORT`, com cobertura de tênis, automobilismo, basquete e demais modalidades encontradas nos feeds configurados. A Resenha publica até oito destaques do dia anterior, sempre com fonte persistida. Ela não tenta transformar manchete em estatística nem inventa resultado ausente na evidência.


### Ajuste de transporte editorial — 20/09/2026

Os feeds Google News restritos aos domínios editoriais responderam HTTP 503 quando consultados com User-Agent de bot no Lovable Cloud. O transporte passa a usar headers compatíveis com navegador apenas para recuperar RSS público; matching, persistência, atribuição do veículo e escopo retrospectivo permanecem inalterados.


### Fontes diretas de RSS — 20/09/2026

Após a validação de produção mostrar bloqueio recorrente do Google News RSS no egress do Lovable, o transporte editorial foi simplificado para feeds RSS diretos dos veículos: ge, Sky Sports, kicker, L'Équipe, AS e La Gazzetta dello Sport. Para outros esportes, ge, AS e Gazzetta fornecem feeds específicos de tênis, automobilismo/F1, basquete, vôlei e esportes variados. A aplicação usa descrição de feed apenas transitoriamente para matching; a evidência persistida/renderizada mantém manchete, fonte, URL e horários, sem republicar o corpo do artigo.


### Hardening final da Resenha — 20/09/2026

O contrato retrospectivo fica fechado em três pontos adicionais. Primeiro, o payload editorial do Palmeiras não preserva mais qualquer próximo compromisso: somente partidas do dia anterior podem permanecer na Resenha. Segundo, os destaques de outros esportes passam por balanceamento por modalidade, com no máximo dois itens por esporte antes do limite global, evitando uma seção dominada por uma única cobertura. Terceiro, o frontend passa a exibir links das fontes jornalísticas persistidas nos itens editoriais; apenas URLs HTTPS gravadas na proveniência com papel `journalism_context` ou `other_sport_editorial` são expostas.


### Refinamento editorial via Lovable AI Gateway — v10

A Resenha passa a ter uma última etapa de edição após a publicação factual. Às 05:10 de Brasília, um endpoint server-side protegido envia ao Lovable AI Gateway somente o texto factual já persistido e as manchetes/fontes editoriais associadas. O modelo reescreve a abertura e os itens em português brasileiro natural, sem alterar placares, minutos, números, nomes ou criar fatos ausentes.

O prompt editorial proíbe programação futura, onde assistir, próximos jogos, invenção de recordes/classificação/lesões/declarações e qualquer atribuição incorreta de fonte. Manchetes em espanhol, italiano, francês, inglês ou alemão devem ser traduzidas/parafraseadas; o identificador técnico `5DollarFootballAPI` não deve aparecer no texto final. A proveniência factual/jornalística continua persistida separadamente e os links de fonte permanecem clicáveis no frontend.

O refinamento usa `LOVABLE_API_KEY` apenas no servidor, via `https://ai.gateway.lovable.dev/v1/chat/completions`, modelo `google/gemini-3.7-flash`. Para evitar respostas excessivamente grandes, os itens são processados em lotes de 12 com uma tentativa de retry por lote. Falha de IA não apaga nem invalida a Resenha factual: o briefing permanece publicado e registra `aiEditorialStatus=FAILED` para diagnóstico.
