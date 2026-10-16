# IE-00.04 — Baseline das superfícies

**Data de referência:** 15/10/2026, America/Sao_Paulo. Consultas principais entre 20:58 e 21:04; a data UTC passou a 16/10 durante o levantamento. **Código:** main `6d78f07f9689b4c31ca1bd76189c970e6c30c949`. **PRIMARY:** Lovable Cloud `hefuvmocohhpmnhwpkac`, acessado pelo projeto canônico `428fa571-e363-4bbf-ab2c-058451eba7dc`.

**Estado da ação:** CONCLUÍDA no escopo de inventário e registro desta revisão; vigência na main exige integração por PR com gates verdes. O diagnóstico registra falhas e itens não verificados; não homologa as jornadas ou a operação.

## Método e alcance

A prioridade escolhida por Kauê é **Resenha diária**. A baseline confronta código versionado, estrutura do banco, contagens e estados atuais. O projeto Lovable reportou o mesmo commit da main e banco habilitado; `supabase/config.toml` no projeto conectado confirmou o PRIMARY acima.

Executadas somente consultas SELECT de metadados, agregados e estados esportivos. Não foram acionados coletores, jobs, geração de edição, APIs esportivas ou procedimentos de escrita. O valor de configuração do worker foi comparado apenas com uma URL já documentada; nenhum token ou credencial foi retornado. Comentários, nomes de usuários, emails, sessões e avaliações pessoais não foram extraídos.

As consultas e resultados estão em [evidência somente leitura](evidence/IE_00_04_2026-10-15_READ_ONLY.json). As leituras ocorreram em instantes distintos; são snapshots datados, não uma transação atômica nem um compromisso de cobertura futura. As contagens do dia foram confirmadas usando a data local de São Paulo após a virada UTC.

## Matriz das seis superfícies

| Superfície | Existe no código | Evidência atual no PRIMARY | Situação e lacunas |
| --- | --- | --- | --- |
| **Noticiário / Resenha** | `src/routes/index.tsx`, `src/lib/news-overview.functions.ts`, política e refinamento em `src/lib/sports/` | Edições de 09 a 14/10: seis FAILED, zero itens, `releaseFailure=no_editorial_items`. Última PUBLISHED: 08/10, um item e nenhum item de partida. Em 07/10: 17 itens, 11 de partidas, 17 refinados | Geração recente sem insumos. A função lê a última PUBLISHED, não necessariamente a edição esperada. Conteúdo e interface autenticada não homologados |
| **Hoje** | `src/routes/hoje.tsx`, `src/lib/today-overview.functions.ts`; programação também na Home | Zero fixtures armazenadas para 14/10 e 15/10 locais; 40 evidências de transmissão, última checagem em 08/10 às 19:17 BRT | Catálogo defasado; zero armazenado não significa ausência de jogos oficiais. Confirmação nominal de transmissão e falha versus vazio continuam abertas |
| **Elo** | `src/routes/elo.tsx`, `src/lib/elo-explorer.functions.ts`, lógica/rotina Elo | 676 linhas globais e 676 clubes distintos. Última atualização das linhas: 15/10 às 03:08 BRT. Sync `main`: PARTIAL, `leagues_processed=5`, encerrado em 15/10 às 05:05 BRT, com erro registrado. Última fixture do histórico: 12/10 às 16:00 BRT | Unicidade global observada; atualização do timestamp não comprova completude. Não foi estabelecido lag contra um conjunto externo elegível nem homologado histórico/filtros |
| **Anotações** | `src/routes/anotacoes.tsx`, `src/lib/notes-overview.functions.ts` | 170 reviews, todos AUTO_CLOSED; zero concluídos, assistidos, comentários preenchidos, notas pessoais e marcas no campinho nas contagens consultadas | Estrutura e fila existem. Persistência com usuário, reabertura, ownership e recuperação não foram exercitados |
| **Analytics** | `src/routes/analytics.tsx`, `src/lib/analytics-overview.functions.ts` | 247 linhas de estatísticas individuais em seis fixtures; 249 linhas de escalação; 247 linhas na projeção por período. Zero linhas em `sports_player_season_stats` e `sports_standings` | O detalhe atual consulta player-season, enquanto há dados prospectivos/projeção por período. Divergência de projeção confirmada; conteúdo do detalhe e temporada precisam de reconciliação |
| **Conta / Privacidade** | `src/routes/conta.tsx`, `src/routes/privacidade.tsx`, `src/lib/privacy.functions.ts`, middleware | Uma conta com provedor Google; funções `is_approved_app_user` e `erase_user_application_data` presentes. RLS habilitado em reviews, notas pessoais, marcas e push | Isso não demonstra login aprovado, isolamento por recurso, exclusão ou restore. Nenhuma operação destrutiva foi executada |

A interface autenticada não foi ensaiada nesta ação. A ausência de endereço público é uma decisão já registrada para a fase de desenvolvimento, não um novo insumo solicitado a Kauê. Metadados `ready`/`is_published` do projeto não comprovam acesso humano ou disponibilidade de endpoints.

## Falha operacional que afeta a Resenha

| Evidência | Resultado observado |
| --- | --- |
| Cron | 20 jobs cadastrados e ativos |
| Janela de respostas HTTP retidas | 385 respostas nas últimas seis horas; 385 com status 404 e corpo classificado como “Project not found”; nenhum timeout/erro de transporte nessa amostra |
| Configuração do worker | `sports_worker_base_url` ainda corresponde a `https://value-bet-engine.lovable.app`, endereço antigo já registrado |
| Código das funções no banco | Os kickers de sync diário, fontes editoriais, refinamento, manutenção e worker usam essa configuração e `net.http_post` |
| Registro de automação | `automation_runs` tem zero linhas; não é possível atribuir individualmente cada resposta da amostra a um despacho por esse registro |
| Coleta | Último sucesso de `fixtures_daily`: 08/10 às 19:30 BRT; última atualização efetiva de uma fixture: 08/10 às 15:00 BRT |
| Contexto editorial | Última coleta de evidência: 08/10 às 04:50 BRT. Há 289 evidências e 315 fact packs no total; último fact pack em 08/10 às 15:00 BRT |
| Fila | 96 jobs vencidos pendentes: 84 de transmissão, sete de forma recente e cinco de dados individuais, no snapshot consultado |

**Conclusão sustentada:** os despachos SQL continuam acontecendo, mas há falha de alcance HTTP do projeto e os fluxos esportivos deixam de registrar progresso desde 08/10. As seis edições recentes falham explicitamente por ausência de itens editoriais. **Inferência principal:** o destino antigo do worker é o bloqueio comum da coleta e do refinamento. Atribuição por requisição e recuperação ponta a ponta ainda precisam de prova; não declarar a causa única encerrada.

O estado `succeeded` em cron significa que sua instrução foi executada, não que o endpoint concluiu a tarefa. As rotinas de preparar/liberar edição e de manutenção interna continuam executando no banco; isso explica a presença de edições FAILED e novos jobs pendentes sem provar funcionamento dos coletores.

A prioridade de correção fica identificada em IE-01.01/04, IE-02.06 e IE-05.01: definir e validar um executor/endereço de worker coerente com a fase do projeto, reconciliar os despachos e verificar uma execução real delimitada. Esta baseline não publica o app, troca URL, altera segredo, reabre fila ou libera nova carga.

## Elencos e camada individual

A contagem atual substitui o uso de 116/116 como se fosse situação presente. O denominador abaixo foi obtido das associações ativas do catálogo das seis competições do piloto, e o numerador indica **clubes com alguma linha ativa de elenco**.

| Competição | Com linhas ativas | Clubes no catálogo |
| --- | ---: | ---: |
| Brasileirão Série A | 13 | 20 |
| Bundesliga | 9 | 18 |
| La Liga | 17 | 20 |
| Ligue 1 | 14 | 18 |
| Premier League | 14 | 20 |
| Serie A italiana | 19 | 20 |
| **Total** | **86** | **116** |

Existem 2.776 linhas ativas de elenco e 2.868 jogadores no catálogo global. Última coleta de elenco: 06/10 às 11:21 BRT. A presença de linhas não comprova elenco completo, vínculo atual ou atualização. Não converter 86/116 em percentual de completude de jogadores.

O Dia Zero persistido é 04/10/2026 às 14:51:23 BRT, versão `prospective-fixture-v1`. Os dados individuais mais recentes foram coletados em 08/10 às 00:36 BRT. As seis competições do catálogo consultado usam a etiqueta `2026/27`, inclusive o Brasil; a correspondência de temporada continua pendente em IE-03/IE-08.

## Outros limites e prioridades

- O Elo mantém 676 clubes únicos, mas seu sync atual está PARTIAL; contagens e timestamp não equivalem a homologação.
- A Home converte falha da programação em `null` e pode mostrar “Sem jogos previstos para hoje”. IE-04.03 permanece aberta.
- O refinamento pode continuar após erro individual de gravação e registrar REFINED; IE-05.07 permanece aberta. O recorte publicado de 07/10 teve zero itens com `editorialStats.source=SofaScore` no formato consultado; não foram inventados números para preencher essa ausência.
- O cron de retenção de desempenho teve uma execução failed nas últimas 24 horas. A causa não foi investigada nesta baseline; encaminhar a IE-01/IE-10. A revisão não altera retenção.
- As consultas administrativas não comprovam autorização da aplicação. RLS habilitado é uma observação de estrutura, não um teste de ownership.
- Não houve conferência externa do conjunto completo de partidas, leitura visual autenticada, teste de login, escrita de nota, exclusão, restore ou chamada a provedor esportivo. Esses limites não ficam implícitos como aprovação.

## Fechamento, validação e continuidade

A baseline identifica estrutura, dados disponíveis, falhas e evidência faltante de todas as superfícies. O critério de IE-00.04 é registrar essa situação, inclusive os estados não verificados; não exige marcar jornadas como aprovadas.

Conferir os links, a paridade das contagens com o JSON, os 104 códigos e suas dependências, o diff exclusivamente documental e os gates obrigatórios da PR. Rollback documental por novo commit de reversão, preservando o diagnóstico datado.

**Próxima ação do eixo: IE-00.05 — confirmar o PROJECT_PROFILE**, levando em conta o uso pessoal, a prioridade Resenha, o processamento externo indisponível e a proteção da memória esportiva. A correção do worker permanece vinculada às ações técnicas e seus controles.
