# Inteligência Esportiva — Roadmap pessoal e operacional

**Versão do roadmap:** 1.0 · **Referência:** Framework EBSA 1.7  
**Data-base:** 11/10/2026 · **Fuso:** America/Sao_Paulo  
**projectKey:** INTELIGENCIA_ESPORTIVA · **Prefixo das ações:** IE  
**Projeto:** [kauefsantos12-creator/intelig-ncia-esportiva](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva)  
**Baseline do código:** main, commit [4696c8eb400a088b226dce0653eb775b64383490](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/commit/4696c8eb400a088b226dce0653eb775b64383490), de 05/10/2026.  
**Modelo da agenda consultado:** main, commit 111b66dbd84da2cdfe224183f4457d81161482fd.  
**Estado deste documento:** IE-00.01 e IE-00.02 integradas. IE-00.03 registra a decisão de Kauê em 15/10/2026: **Resenha diária como prioridade**. Decisão concluída no escopo desta revisão; integração por PR exige gates verdes. Próxima: IE-00.04 — baseline das superfícies. Desenvolvimento por commits, sem endereço público nesta fase.

## 1. Propósito e forma de trabalhar

Este projeto é um hobby especialmente importante para Kauê. A finalidade é reunir uma leitura esportiva de qualidade, a programação dos jogos, o contexto dos clubes e jogadores e a sua memória pessoal do que acompanhou.

O roadmap precisa proteger três coisas: **prazer em usar**, **confiança no que aparece** e **continuidade do histórico pessoal**. Uma tela bonita com estatística incompleta não cumpre esse objetivo; uma base grande que exige manutenção constante também precisa ser revista à luz do uso pessoal.

**Prioridade confirmada por Kauê em 15/10/2026: Resenha diária.** A primeira rotina a melhorar e validar é a leitura da resenha. O ciclo **ler a resenha → escolher jogos → registrar o que assistiu** permanece proposta de evolução; a escolha não aprova automaticamente o escopo completo da candidata R1. Hoje, Anotações, Elo e Analytics continuam no projeto, com suas dependências e critérios próprios.

O projeto vigente contém Noticiário, Hoje, Elo, Anotações, Analytics e Conta/Privacidade. O reescopo documentado encerrou o runtime de apostas. Odds, banca, picks e execução financeira não fazem parte deste roadmap. Código e documentos antigos permanecem como histórico; sua existência não autoriza reativação.

### Regras específicas deste hobby

- Preservar os três eixos editoriais aprovados: Resenha explicativa, Contraste entre placar e desempenho e Protagonista dentro do jogo.
- Preservar dados, notas e campinho pessoais; uma mudança de provedor ou conta não pode apagar a memória esportiva.
- Não exigir que todos os elencos estejam completos para oferecer agenda e resenha úteis.
- Mostrar ausência, falha, parcialidade e desatualização como estados diferentes.
- Não inventar números, cobertura, causalidade, leitura tática ou confirmação de transmissão.
- Expandir ligas, fontes, alertas e indicadores conforme interesse de Kauê, capacidade e custo comprovados.
- Trabalhar em entregas pequenas, com um resultado utilizável por vez. O roadmap não impõe prazo nem obrigação de assistir/anotar jogos.
- Aplicar EBSA de forma proporcional ao escopo, mantendo os controles obrigatórios ativos. A importância afetiva do projeto não determina automaticamente uma classe técnica CRITICO.

## 2. O que esta versão verificou

Foi realizada leitura dirigida do framework anexado, dos modelos da agenda e da documentação/código atuais do projeto pelo GitHub conectado. Foram consultados contratos, rotas, funções de dados, política editorial, worker, autenticação, migrations novas e CI.

| Tipo de evidência | Significado neste roadmap |
| --- | --- |
| VERIFICADO — leitura | Código, documento ou metadado observado na baseline indicada. Não implica reprodução em produção. |
| REGISTRO HISTÓRICO | Relato datado do repositório; vale para seu ambiente/data, não comprova o banco atual. |
| INFERIDO | Consequência plausível da estrutura observada, ainda sem reprodução do cenário. |
| NÃO VERIFICADO | Exige consulta/teste do runtime ou validação humana. |
| PROPOSTO | Decisão nova sugerida; não deve ser convertida automaticamente em requisito aprovado. |

**Na análise de planejamento (antes da execução da IE-00.01):** não foram executados testes da aplicação, login, consultas ao banco vivo, deploy, carga de dados ou ensaio de restore. Nenhum arquivo/branch/issue do GitHub foi alterado. O roadmap não foi cadastrado na agenda e não houve mensagem ao Lovable.

**CI observado:** os checks test-and-build e Browser compatibility and accessibility do commit-base constavam como concluídos com sucesso em 05/10/2026. Isso é evidência do pipeline daquele commit, não de sincronização/publicação nem de dados completos em 11/10.

**Fluxo de mudança:** implementado ≠ testado ≠ mergeado ≠ sincronizado ≠ publicado ≠ validado em produção.

## 3. Identidade e pontos de atenção da baseline

| Item | Observação | Estado |
| --- | --- | --- |
| Repositório vigente | kauefsantos12-creator/intelig-ncia-esportiva; main; baseline acima | VERIFICADO — GitHub |
| Backend autoritativo | Lovable Cloud, conforme AGENTS e PROJECT_STATE | VERIFICADO — regra documentada |
| Banco declarado | hefuvmocohhpmnhwpkac, conforme PROJECT_STATE/recuperação do remix | REGISTRO DOCUMENTAL; runtime não verificado |
| Endereço público nesta fase | Não existe, conforme definição de Kauê em 11/10/2026 | NÃO SE APLICA nesta preparação; publicação será verificada na etapa correspondente |
| Identidade no README | Ainda aponta quant-football-insights e URL antiga | VERIFICADO — divergência documental |
| Migrations | 135 arquivos SQL em migrations_archive e 2 em migrations na baseline | VERIFICADO — inventário GitHub |
| Aplicação das migrations no Cloud | Não inspecionada nesta análise | NÃO VERIFICADO |
| Elencos 116/116 | Registro de 19/09 anterior ao remix; reaparece no estado canônico | REGISTRO HISTÓRICO; cobertura atual não comprovada |
| Elencos após remix | Documento de 04/10 registra 15 clubes com linhas de elenco e fila limitada por quota | REGISTRO HISTÓRICO; não é contagem de hoje |
| Elo após recuperação | Documento de 04/10 relata 32 alvos domésticos, 9 continentais e 676 clubes globais | REGISTRO HISTÓRICO; freshness atual não comprovada |
| Política editorial | editorial-explanatory-v3, 14 veículos, SofaScore para desempenho numérico da resenha | VERIFICADO — código/documento |
| Acesso | Middleware verifica Google, sessão e is_approved_app_user | VERIFICADO — código; comportamento vivo não testado |
| Proteção da main | Endpoint de branch retornou protected=false; coleção de rulesets retornou vazia | VERIFICADO — metadados; decidir proteção proporcional ao mantenedor único |

### Achados que orientam as ações

A severidade abaixo é preliminar, no contexto da entrega afetada. AUDIT-0 bloqueia operação; AUDIT-1 bloqueia liberação; AUDIT-2 exige plano; AUDIT-3 pode ficar em backlog. Esta leitura não substitui a auditoria de uma candidata real.

| ID | Achado | Evidência / limite | Prioridade inicial | Ação principal |
| --- | --- | --- | --- | --- |
| A-01 | Identidade antiga no README conflita com o estado canônico atual | README × PROJECT_STATE | AUDIT-2 | IE-00.01 / IE-00.02 |
| A-02 | ARCHITECTURE e partes de GOVERNANCE ainda descrevem o antigo produto de apostas | Leitura dos documentos; não prova runtime reativado | AUDIT-2 | IE-00.02 |
| A-03 | PROJECT_STATE ainda lista restauração de migrations como pendente, embora o arquivo histórico esteja presente | Inventário + REMIX_RECOVERY; aplicação remota não verificada | AUDIT-2 | IE-00.04 / IE-01.01 |
| A-04 | “116/116” não comprova cobertura após a troca de banco | Registros de 19/09 × SQUAD_COLLECTION_PACING de 04/10 | Pendência material de dados | IE-03.01 / IE-03.02 |
| A-05 | Falha da programação na Home é capturada como null e pode produzir “Sem jogos previstos para hoje” | index.tsx: refresh e scheduleFixtures; VERIFICADO por leitura | AUDIT-1 na entrega de programação | IE-04.03 |
| A-06 | Home trata presença de evidência de transmissão como confirmação interna; o sync observado usa agregadores | index.tsx + futnatv-broadcast-sync; falta comprovar cadeia oficial | AUDIT-1 se apresentada como confirmação oficial | IE-04.04 / IE-04.05 |
| A-07 | Evidências do agregador são apagadas e reinseridas em chamadas separadas | Código VERIFICADO; perda na falha intermediária INFERIDA | AUDIT-2 | IE-04.06 / IE-LP2.03 |
| A-08 | Analytics de equipe lê player-season, enquanto a etapa prospectiva documenta agregação por partidas | analytics-overview × documento Etapa 4; falta reproduzir reconciliação | NÃO VERIFICADO; possível bloqueador de Analytics | IE-LP2.01 / IE-08.01 |
| A-09 | Refinamento pode gravar status REFINED mesmo com falhas individuais de update | editorial-ai-refinement: continua no erro e registra contagens; VERIFICADO por leitura | AUDIT-2 | IE-05.07 |
| A-10 | Fila e funções usam recorte 2026/27; é preciso conferir sua correspondência com competições como Brasil | Código do worker + temporada nos contratos; não foi consultado o banco | NÃO VERIFICADO | IE-03.07 / IE-08.02 |
| A-11 | Regras documentais exigem PR/CI, mas a proteção técnica observada não obriga esses checks na main | Metadados da branch/rulesets; CI existe e estava verde | AUDIT-2 | IE-01.07 / IE-09.01 |

**Preservar:** middleware de acesso; normalização e proveniência; coleta com cache/quota; fila com lease/heartbeat; Elo versionado; nota pessoal separada do provedor; migrations antigas arquivadas; CI de banco/browser; padrão editorial consolidado.

## 4. Perfil EBSA preliminar e decisões pendentes

Este quadro orienta I0.5. Não é um PROJECT_PROFILE aprovado e não encerra G3.25. A ação IE-00.05 deve produzir o perfil formal com evidência por campo.

| Campo / assunto | Valor preliminar / decisão |
| --- | --- |
| project_type | Aplicação web pessoal de inteligência esportiva; formalizar no schema |
| service_class | PROPOSTA: INTERNO; confirmar tolerância a perda/indisponibilidade |
| exposure | Uso pessoal autenticado documentado; confirmar exposição efetiva e audiência |
| backend_type / primary_role | Lovable Cloud / PRIMARY documentados; confirmar ambiente vivo |
| criticality | UNKNOWN técnico; importância pessoal elevada não basta para preencher a classe |
| data_residency_constraints | UNKNOWN; identificar restrições aplicáveis |
| human_interface | true — rotas e jornadas humanas presentes |
| replica_enabled | UNKNOWN; não copiar a decisão de réplica tomada para NAT ou outro projeto |
| auth_required | true — middleware e perfil single-user documentados |
| privileged_roles | UNKNOWN no perfil; existem caminhos com cliente administrativo a inventariar |
| personal_data | true — conta, comentários e avaliações ligados ao usuário |
| sensitive_data | UNKNOWN — avaliar ingestão de lesões e conteúdo privado |
| children_or_adolescents_data | UNKNOWN — escopo editorial inclui base; identificar quais dados de atletas são tratados |
| storage_files | UNKNOWN — distinguir arquivos próprios de imagens externas por URL |
| external_integrations | true — provedores esportivos, fontes editoriais e IA |
| public_api | UNKNOWN — distinguir endpoint alcançável de API liberada ao público |
| payments_or_financial_impact | Fluxo financeiro de apostas não está ativo; classificar formalmente o campo e os custos operacionais de terceiros |
| automated_decisioning | UNKNOWN — avaliar as transformações/rankings e o uso efetivo, sem inferir false |
| domain_rules_required | true — tempo, escopo, métricas, editorial, notas e identidade |
| owners | Kauê é usuário e decisor do produto; confirmar responsáveis técnico, dados, operação, segurança e privacidade |

Se INTERNO for aprovado, o núcleo EBSA traz como padrão **SLO 99,5%, RTO 240 minutos, RPO 1.440 minutos e ensaio semestral de restauração**. São objetivos candidatos, não medições alcançadas. Anotações podem exigir tolerância de perda menor; decidir explicitamente e provar com restore. Outro alvo para controle DEFAULT_WITH_ADR_EXCEPTION exige ADR e evidência; controles obrigatórios não são dispensados por ser hobby.

### Decisões a conduzir uma por vez

1. **Decidido em 15/10/2026: Resenha diária primeiro.** Preservar prazer de uso, confiança no conteúdo e memória pessoal já definidos neste roadmap; demais preferências continuam abertas.
2. Audiência, classe de serviço e perda tolerável de anotações.
3. Orçamento de APIs/IA e prioridade de cobertura.
4. Necessidade e finalidade de réplica externa.
5. Política do fallback futebol.tv.br e evidência de confirmação nominal.
6. Escopo de categorias do Palmeiras, seleções e outros esportes conforme fontes disponíveis.
7. Retenção, exportação e regras de mudança de “assistiu” para “não assistiu”.

As decisões não atrasam leitura e preparação independentes. Mudanças dependentes aguardam a resposta correspondente; silêncio não equivale a aceite.

## 5. Fontes com funções distintas

| Finalidade | Fonte / regra preservada |
| --- | --- |
| Catálogo, resultados e dados gerais de futebol | 5Dollar no domínio atual, com proveniência; fatos decisivos/controversos e consequências exigem confirmação oficial aplicável |
| Elencos, escalações e dados individuais | API-Football no escopo individual validado |
| Números de desempenho da resenha de futebol | Exclusivamente SofaScore; ausência implica omissão, sem completar por outro provedor |
| Interpretação jornalística | Veículos da tabela seguinte; atribuição precisa e limites do conteúdo efetivamente consultado |
| Fatos oficiais, regulamento, agregado e classificação | Competição, entidade ou clube oficial, conforme o fato |
| Descoberta da transmissão | FutNaTV prioritário; fallback existente sujeito à política de fontes |
| Confirmação da transmissão no Brasil | Mapa de direitos aplicável + grade/site oficial com identificação nominal do confronto |
| Elo e Analytics | Dados e métricas canônicos versionados; não são fonte substituta da narrativa editorial |
| Opinião e nota pessoal | Kauê, identificadas como avaliação própria |

| País | Referência editorial inicial | Complementar |
| --- | --- | --- |
| Alemanha | Kicker | BILD Sport |
| Espanha | Marca | AS |
| Inglaterra | BBC Sport | Sky Sports |
| França | L’Équipe | RMC Sport |
| Itália | La Gazzetta dello Sport | Corriere dello Sport |
| Portugal | A Bola | Record |
| Brasil | ge | UOL Esporte |

Não exigir duas matérias em todo jogo. Sem cobertura suficiente, escrever apenas os fatos oficiais verificados. Fora da lista, não incorporar um veículo novo automaticamente. Conteúdo de RSS parcial não sustenta reconstrução tática como se a matéria inteira tivesse sido lida.

**Data editorial:** o padrão versionado de 05/10 governa o dia civil anterior completo, incluindo jogos iniciados após 21h. Não recuperar a regra antiga que movia esses jogos automaticamente para outra edição.

**Escopos independentes:** resenha acompanha as primeiras/segundas divisões e copas previstas no padrão, Brasil A–D, seleções, Palmeiras e outros eventos relevantes. A coleta individual prospectiva tem escopo menor: Premier League, Ligue 1, Brasileirão A, Bundesliga, Serie A italiana e La Liga. Cobertura editorial não promete escalação/estatística individual em todas essas competições.

## 6. Organização da execução e das entregas

Os códigos IE identificam ações e capítulos. Os únicos gates EBSA continuam I-1, I0, I0.5 e G0–G12, incluindo seus intermediários. LP1/LP2/LP3 são trilhas locais de especificação, execução/autoridade e auditoria, não gates novos.

### Ordem de preparação

IE-00 → IE-LP1 → IE-01 → IE-02. **Resenha (IE-05) é a primeira prioridade funcional escolhida por Kauê.** Após a base comum, avançar essa trilha conforme suas dependências; Hoje, Elo e Elencos mantêm trilhas próprias. Anotações acompanha Hoje; Analytics depende da coleta individual e consistência de projeções. Uma resenha útil não precisa aguardar todos os elencos.

### Candidatas propostas

| Entrega | Valor para Kauê | Escopo necessário | Não precisa aguardar |
| --- | --- | --- | --- |
| R1 — Ciclo diário pessoal | Ler, escolher jogos e guardar impressões | IE-00, IE-LP1, IE-01, IE-02, IE-05, IE-04, IE-07; auditoria/liberação do escopo | Completar todos os elencos, histórico Elo de 60 dias ou Analytics |
| R2 — Exploração de Elo | Ranking e histórico confiáveis | Base comum + IE-06; reabrir IE-LP3/IE-09 para essa candidata | Analytics individual |
| R3 — Exploração individual | Elencos/jogadores e comparações rastreáveis | Base comum + IE-03, IE-LP2, IE-08; reabrir IE-LP3/IE-09 | Expansão de ligas fora do piloto |
| R4 — Expansões escolhidas | Novas categorias, indicadores ou comodidades | Escolha de Kauê + avaliação de contratos, quota/custo e gates afetados | Nenhuma funcionalidade é incluída automaticamente |

R1, R2 e R3 continuam propostas de composição de entrega. IE-00.03 confirmou **Resenha primeiro**; IE-LP3.01 deve registrar o escopo concreto da candidata a partir dessa prioridade, preservando os controles e dependências aplicáveis. Uma ação comum já validada pode ser reutilizada quando commit, dados, ambiente e finalidade não tiverem mudado materialmente.

O fechamento de IE-LP3 é preparação da auditoria. G10.5 definitivo ocorre em IE-09 após G8 e G10 da candidata correspondente. R1 exige os finais de Resenha, Hoje e Anotações e a consistência integrada IE-LP2.07. IE-06/IE-08 só entram na dependência quando estiverem na candidata.

### Estados e progresso compatíveis com a agenda

| Estado | Uso |
| --- | --- |
| PENDENTE | Trabalho ainda não executado para o escopo desta versão |
| EM EXECUÇÃO | Ação aberta com trabalho/evidência em andamento |
| BLOQUEADO | Dependência obrigatória ainda não satisfeita |
| AGUARDANDO DECISÃO | Preferência ou aceite necessário |
| AGUARDANDO INSUMO | Falta referência, dado ou recurso específico |
| NÃO VERIFICADO | Precisa de prova no alvo adequado |
| CONCLUÍDO | Critério de saída atendido e evidência válida registrada |
| NÃO SE APLICA | Condição inativa comprovada; não é atalho para UNKNOWN |

Na baseline de planejamento, os checkboxes estavam abertos porque eram compromissos de validação/entrega deste novo roadmap. Os registros datados abaixo distinguem IE-00.01 (identidade), IE-00.02 (documentação) e IE-00.03 (prioridade Resenha); as demais ações continuam abertas. Isso **não significa que o projeto atual está 0% implementado**. Reaproveitar a baseline e os testes existentes em vez de reconstruir o que já funciona.

Progresso da candidata = ações concluídas / ações aplicáveis no escopo fechado da candidata. NÃO VERIFICADO e AGUARDANDO DECISÃO não contam como concluídos. N/A justificado sai do denominador, mas fica no histórico. Mostrar quantidade e escopo junto do percentual; progresso de tarefas não substitui cobertura de dados.

## 7. Roadmap detalhado

Cada capítulo apresenta finalidade, dependências, referências EBSA e condição de saída. O estado inicial é uma proposta operacional. Os gates citados apontam controles a satisfazer/reabrir; a presença do título não comprova sua aprovação.

## IE-00 — Identidade, baseline e perfil do hobby

**Por que existe:** Evitar que o projeto novo herde endereço, métricas ou regras do banco antigo. Traduzir a importância pessoal do hobby em decisões concretas.

**Entrada:** Leitura/preparação autorizadas e fontes identificadas.  
**Referências EBSA:** I-1, I0, I0.5, G0, G2, G3, G3.25, G3.5.  
**Saída do capítulo:** Identidade atual comprovada, escopo pessoal registrado e perfil confirmado para a próxima entrega.

### IE-00.01 — Fixar a identidade do projeto atual

- [x] Confirmar repositório, main, commit, projeto Lovable conectado, URL usada por Kauê e banco PRIMARY. Confrontar README, PROJECT_STATE, configuração e runtime; não copiar IDs antigos.
- **Estado inicial:** NÃO VERIFICADO. **Estado atual (11/10/2026):** CONCLUÍDO no escopo de identidade da fase de desenvolvimento. Endereço público: NÃO SE APLICA, confirmado por Kauê. Evidência: [IE_00_01_PROJECT_IDENTITY_2026-10-11.md](../governance/IE_00_01_PROJECT_IDENTITY_2026-10-11.md). **Depende de:** —.

### IE-00.02 — Separar estado atual de histórico

- [x] Revisar README, ARCHITECTURE, GOVERNANCE e PROJECT_STATE. Identificar conteúdos anteriores ao remix e ao encerramento das apostas; preservar histórico com indicação de que não governa o produto atual.
- **Estado inicial:** PENDENTE. **Estado em 15/10/2026:** CONCLUÍDO no escopo documental desta revisão, com verificações locais aprovadas; vigência na main condicionada à integração por PR com gates verdes. Evidência em `docs/governance/IE_00_02_CURRENT_STATE_HISTORY_2026-10-15.md`. **Depende de:** IE-00.01.

### IE-00.03 — Definir a experiência pessoal prioritária

- [x] Registrar com Kauê o que torna o hobby especial e qual rotina ele quer melhorar primeiro. **Decisão em 15/10/2026: Resenha diária**, em resposta direta à escolha entre resenha, jogos e anotações. Preservar os princípios pessoais já registrados; ciclo completo e preferências adicionais permanecem sujeitos às decisões próprias.
- **Estado inicial:** AGUARDANDO DECISÃO. **Estado atual:** CONCLUÍDO no escopo da decisão desta revisão; integração por PR com gates verdes. Evidência: [IE_00_03_REVIEW_PRIORITY_2026-10-15.md](../governance/IE_00_03_REVIEW_PRIORITY_2026-10-15.md). **Depende de:** IE-00.02.

### IE-00.04 — Registrar a baseline de cada superfície

- [ ] Listar Noticiário, Hoje, Elo, Anotações, Analytics e Conta: existe no código, funciona no ambiente atual, lacunas e última evidência. Toda contagem de clubes/jogos precisa de data e banco de origem.
- **Estado inicial:** NÃO VERIFICADO. **Depende de:** IE-00.03.

### IE-00.05 — Confirmar o PROJECT_PROFILE

- [ ] Preencher os campos materiais da seção de perfil, com evidência e responsáveis. Confirmar classe de serviço, exposição, réplica, uso de lesões/base, APIs e arquivos; UNKNOWN permanece pendente.
- **Estado inicial:** AGUARDANDO DECISÃO. **Depende de:** IE-00.04.

### IE-00.06 — Classificar dados e fronteiras de confiança

- [ ] Distinguir dados esportivos, conta, comentários privados, avaliações pessoais, lesões e atletas menores. Mapear terceiros, finalidade, retenção, exportação e ameaças de associação incorreta, segredo e perda de histórico.
- **Estado inicial:** PENDENTE. **Depende de:** IE-00.05.

### IE-00.07 — Fechar as decisões iniciais

- [ ] Registrar identidade, escopo, responsáveis, perfil, riscos e aceite da primeira fatia de entrega. Reutilizar documentação vigente e abrir decisões apenas para lacunas reais; nenhuma implementação histórica vira aceite atual automaticamente.
- **Estado inicial:** PENDENTE. **Depende de:** IE-00.06.

## IE-LP1 — Especificar regras esportivas e contratos

**Por que existe:** Dar o mesmo significado a um jogo, um número e um comentário em todas as abas, antes de ajustar o comportamento.

**Entrada:** IE-00.07.  
**Referências EBSA:** G0, G4, G6, G6.5.  
**Saída do capítulo:** Contratos e exemplos aprovados; regras localizadas por camada. Este desenho não encerra G6/G6.5 nem autoriza carga.

### IE-LP1.01 — Definir o escopo por finalidade

- [ ] Criar matriz competição × categoria × superfície × provedor. Separar agenda geral, cobertura da resenha, Elo e detalhamento individual. Resenha/Hoje não dependem de completar todos os elencos.
- **Estado inicial:** PENDENTE. **Depende de:** IE-00.07.

### IE-LP1.02 — Fixar as referências temporais

- [ ] Usar America/Sao_Paulo. Resenha: dia civil anterior completo, pela hora de início, inclusive após 21h; partidas ainda em andamento não recebem resultado final inventado. Registrar data da edição, evento, coleta e corte do Elo.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP1.01.

### IE-LP1.03 — Definir as entidades e relações

- [ ] Contrato para competição, temporada, equipe, atleta, partida, escalação, estatística, transmissão, edição, item editorial, anotação e marca no campinho. Cada relação precisa de chave e regra para mudança/correção.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP1.02.

### IE-LP1.04 — Separar as funções das fontes

- [ ] 5Dollar: catálogo e dados gerais; API-Football: jogador/elenco; SofaScore: desempenho numérico da resenha; veículos aprovados: interpretação; fonte oficial: fatos/consequências e confirmação de transmissão. Registrar source + definition_version.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP1.03.

### IE-LP1.05 — Definir completude, ausência e defasagem

- [ ] Distinguir dado ausente, coleta parcial, indisponível, fora do escopo, desatualizado e zero real. Percentuais precisam de numerador, denominador e data. Consulta sem erro não comprova completude.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP1.04.

### IE-LP1.06 — Fixar os contratos editoriais e de transmissão

- [ ] Usar os três eixos aprovados, sem Elo/odds na narrativa; descoberta de canal não equivale à confirmação oficial. Incluir exemplos com fonte ausente, placar agregado, pênaltis, minuto 90 e partida adiada.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP1.05.

### IE-LP1.07 — Fixar as regras de Anotações e Analytics

- [ ] Separar nota pessoal, nota do provedor e estatística observada; definir assistiu/não assistiu, rascunho/conclusão e reversão. Analytics identifica período, amostra, competição, provedor e Dia Zero; sem mistura silenciosa de temporadas.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP1.06.

### IE-LP1.08 — Localizar e homologar as regras

- [ ] Montar matriz regra → backend/banco → projeção/UI → teste → evidência. Preservar definição de métricas e Elo; mudança semântica exige versão e exemplos aprovados. Emitir DATA_RELEASE somente após os gates de dados e fundação aplicáveis.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP1.07.

## IE-01 — Fundação, acesso e recuperação

**Por que existe:** A primeira garantia do hobby é conseguir entrar e recuperar sua memória esportiva se ocorrer outra mudança de ambiente.

**Entrada:** IE-LP1.08.  
**Referências EBSA:** G1, G2, G3.5, G4, G4.5, G5, G5.25, G5.5.  
**Saída do capítulo:** Acesso e integridade demonstrados no alvo correto; restore ensaiado e capacidade/quotas medidas.

### IE-01.01 — Comprovar o caminho de schema e os ambientes

- [ ] Registrar executor de schema, destino de teste, produção e procedimento de deploy. Ensaiar uma alteração sintética isolada. As 135 migrations arquivadas são para reconstrução de teste, não replay automático no Cloud.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP1.08.

### IE-01.02 — Validar login, allowlist e sessão

- [ ] Testar Google autorizado, conta não autorizada, ausência de token, expiração, logout e retomada. Conferir is_approved_app_user e prazo absoluto no servidor, sem confiar apenas no AuthGate.
- **Estado inicial:** NÃO VERIFICADO. **Depende de:** IE-01.01.

### IE-01.03 — Validar autorização por recurso

- [ ] Testar leitura/escrita direta sem UI, ownership de reviews/notas, RPCs, grants, RLS e views. Conferir cada função que usa cliente administrativo; o login aprovado não dispensa restrição por recurso.
- **Estado inicial:** PENDENTE. **Depende de:** IE-01.02.

### IE-01.04 — Isolar segredos e integrações

- [ ] Credenciais privilegiadas permanecem no servidor. Inventariar endpoints, timeout, cache, retry, custo e efeitos; manter Actions fixadas e lockfile. Não imprimir tokens nem payload pessoal em logs.
- **Estado inicial:** PENDENTE. **Depende de:** IE-01.03.

### IE-01.05 — Definir backup e ensaiar restauração

- [ ] Priorizar anotações, notas, campinho, regras e histórico Elo. Medir perda e tempo de recuperação em alvo isolado, incluindo identidade dos usuários e arquivos se houver; registrar RPO/RTO aprovados.
- **Estado inicial:** PENDENTE. **Depende de:** IE-01.04.

### IE-01.06 — Medir capacidade e orçamento do hobby

- [ ] Medir o pico real: abas, worker, Elo e geração editorial concorrentes. Aplicar fator de segurança EBSA ou exceção aprovada; simular chamadas externas para stress, sem consumir quota real nem escrever em produção.
- **Estado inicial:** PENDENTE. **Depende de:** IE-01.05.

### IE-01.07 — Fechar a fundação operacional

- [ ] Registrar G5.5 e seus limites: ambiente, commit, acesso, restore, métricas, runbook, responsabilidades e rollback. Definir a validade das evidências e revisar os gates afetados por mudanças de banco/fornecedor.
- **Estado inicial:** PENDENTE. **Depende de:** IE-01.06.

## IE-02 — Catálogo canônico, ingestão e cobertura

**Por que existe:** A agenda, a resenha e o Elo precisam reconhecer o mesmo jogo, sem depender da conclusão da coleta de jogadores.

**Entrada:** IE-01.07.  
**Referências EBSA:** G5, G5.5, G6, G6.5, G7.  
**Saída do capítulo:** Catálogo rastreável, cobertura medida e fila previsível; fluxos reais novos com DATA_RELEASE específico.

### IE-02.01 — Inventariar os dados vivos e a configuração

- [ ] Consultar somente leitura: competições, equipes, fixtures, fontes, Dia Zero, sync_state, jobs e cron. Comparar com os scripts de recuperação e registrar atualidade; não reutilizar 20 jobs ou 676 clubes como contagem de hoje.
- **Estado inicial:** NÃO VERIFICADO. **Depende de:** IE-01.07.

### IE-02.02 — Formalizar os contratos dos fluxos

- [ ] Para cada dataset: fonte, grão, chave, tipos, temporada, timestamps, qualidade, idempotência, retenção e recuperação. Registrar a conformidade dos fluxos existentes sem fabricar aprovação retroativa; novos fluxos aguardam DATA_RELEASE.
- **Estado inicial:** PENDENTE. **Depende de:** IE-02.01.

### IE-02.03 — Validar reconciliação entre provedores

- [ ] Testar aliases, homônimos, equipes de base/feminino, mandante/visitante e janela de horário. Identidade ambígua não vira vínculo automático. Preservar regras de liga doméstica, continental e divisão já corrigidas.
- **Estado inicial:** PENDENTE. **Depende de:** IE-02.02.

### IE-02.04 — Medir cobertura por competição

- [ ] Comparar conjunto esperado com conjunto coletado na data-base, usando referências aplicáveis e lacunas identificadas. Expor contagem e última coleta; não chamar ausência de fixture no provedor de ausência de jogo oficial.
- **Estado inicial:** PENDENTE. **Depende de:** IE-02.03.

### IE-02.05 — Validar quotas, cache e prioridades

- [ ] Conferir limites atuais do plano e throttling compartilhado. Preservar dois requests/minuto e espaçamento de quinze segundos como configuração encontrada, sem presumir que o plano suporta a cobertura pretendida.
- **Estado inicial:** PENDENTE. **Depende de:** IE-02.04.

### IE-02.06 — Validar fila, retry e execução efetiva

- [ ] Testar leases, heartbeat, fencing, idempotência, quota diária, 429, falha transitória e jobs mortos. Dispatch HTTP não equivale a sucesso; job sem resultado útil não comprova dataset completo.
- **Estado inicial:** PENDENTE. **Depende de:** IE-02.05.

### IE-02.07 — Autorizar e reconciliar os fluxos necessários

- [ ] Para novos/reabertos fluxos materiais, registrar contrato, regras, executor, restore, alvo e aceite em DATA_RELEASE. Carregar amostra delimitada e conferir quantidades, chaves e erros. Planejamento não dispara carga.
- **Estado inicial:** PENDENTE. **Depende de:** IE-02.06.

### IE-02.08 — Fechar a base comum

- [ ] Entregar matriz escopo × cobertura × freshness × fila × custo, com limitações visíveis. Liberar as trilhas Hoje, Resenha, Elo e Elencos conforme seus próprios dados; gargalo de um fornecedor não bloqueia todas as abas.
- **Estado inicial:** PENDENTE. **Depende de:** IE-02.07.

## IE-05 — Resenha diária e experiência de leitura

**Por que existe:** Entregar uma leitura que explica os jogos com cuidado editorial e números sustentados, preservando o padrão escolhido por Kauê.

**Entrada:** IE-02.08.  
**Referências EBSA:** G4, G4.5, G5, G6, G6.5, G7.  
**Saída do capítulo:** Uma edição do dia anterior rastreável e legível; casos de ausência e falha também aprovados.

### IE-05.01 — Conferir o pipeline e o horário da edição

- [ ] Identificar cron ativo, data solicitada, janela de apuração e ordem fatos → estatísticas → fontes editoriais → redação. Manter 05h05 de Brasília como horário pretendido e distinguir início do job de edição disponível.
- **Estado inicial:** NÃO VERIFICADO. **Depende de:** IE-02.08.

### IE-05.02 — Conferir as fontes editoriais autorizadas

- [ ] Validar os 14 veículos da tabela deste documento, links nominais e atribuição. RSS/manchete não equivale à matéria completa; fonte inacessível mantém redação factual. Não adicionar veículos automaticamente.
- **Estado inicial:** PENDENTE. **Depende de:** IE-05.01.

### IE-05.03 — Preservar a estatística editorial do SofaScore

- [ ] Verificar vínculo correto do confronto e, quando usado, atleta. Cada número precisa de origem, data e contexto; sem SofaScore, omitir desempenho numérico. 5Dollar/API-Football continuam nas suas finalidades próprias.
- **Estado inicial:** PENDENTE. **Depende de:** IE-05.02.

### IE-05.04 — Validar os três eixos em exemplos variados

- [ ] Revisar resenha explicativa, contraste placar/desempenho e protagonista em narrativa natural. Variar aberturas; não forçar contraste, tática ou protagonista sem evidência. Testar jogo comum, clássico, goleada e empate sem gols.
- **Estado inicial:** PENDENTE. **Depende de:** IE-05.03.

### IE-05.05 — Validar limites temporais e esportivos

- [ ] Testar início após 21h, virada do dia, jogo ainda ao vivo, adiamento, agregado, prorrogação e pênaltis. Minutos são relógio total da partida; minuto 90 sozinho não comprova acréscimo.
- **Estado inicial:** PENDENTE. **Depende de:** IE-05.04.

### IE-05.06 — Validar Palmeiras e o escopo ampliado

- [ ] Conferir eventos oficiais elegíveis de principal, feminino, base e outras modalidades. Ausência no pacote não prova ausência de evento. Seleções, demais países e outros esportes seguem cobertura comprovada e profundidade proporcional.
- **Estado inicial:** PENDENTE. **Depende de:** IE-05.05.

### IE-05.07 — Tratar refinamento parcial e falha da IA

- [ ] Simular lote recusado, resposta inválida e falha de persistência de item. Conferir status e contagens, preservar texto factual e evitar REFINED como sucesso integral quando apenas parte da edição foi gravada.
- **Estado inicial:** PENDENTE. **Depende de:** IE-05.06.

### IE-05.08 — Expor proveniência e qualidade de leitura

- [ ] Permitir conferir fontes de fatos, métricas e interpretação sem poluir a narrativa. Priorizar celular, hierarquia e parágrafos curtos; resenha sem programação futura/Elo, com cards da página tratados como módulos separados.
- **Estado inicial:** PENDENTE. **Depende de:** IE-05.07.

### IE-05.09 — Homologar uma edição completa com Kauê

- [ ] Confrontar cada afirmação de uma edição real elegível com suas evidências; testar também dia sem jogos e fonte indisponível. Registrar o que Kauê gostou, o que incomodou e os ajustes aprovados; não reduzir qualidade a texto gerado.
- **Estado inicial:** PENDENTE. **Depende de:** IE-05.08.

### IE-05.10 — Fechar a entrega editorial

- [ ] Guardar edição, fontes, versão editorial, prompt, commit, horário e estado de cada etapa. Regeração deve ser identificável e idempotente; publicação depende da auditoria e do aceite da candidata correspondente.
- **Estado inicial:** PENDENTE. **Depende de:** IE-05.09.

## IE-04 — Hoje, programação e contexto para assistir

**Por que existe:** Ajudar Kauê a decidir o que acompanhar, com horário certo e uma transmissão cuja origem possa ser conferida.

**Entrada:** IE-02.08.  
**Referências EBSA:** G4, G4.5, G5, G6, G6.5, G7.  
**Saída do capítulo:** Agenda completa no escopo acordado e transmissão com estado de evidência explícito.

### IE-04.01 — Validar a agenda geral antes do enriquecimento

- [ ] Conferir existência, competition kind, mandante/visitante e ordenação nas ligas/copas acompanhadas. Dados de jogadores não determinam se o jogo aparece; manter o corte de escopo antes de limite/paginação.
- **Estado inicial:** PENDENTE. **Depende de:** IE-02.08.

### IE-04.02 — Validar fuso e mudanças da partida

- [ ] Conferir horários de Brasília, virada do dia e transições agendado/ao vivo/encerrado/adiado/cancelado. Testar atualização intradiária sem alterar silenciosamente a data de anotações já criadas.
- **Estado inicial:** PENDENTE. **Depende de:** IE-04.01.

### IE-04.03 — Corrigir falha apresentada como agenda vazia

- [ ] Reproduzir a falha de getTodayOverview na Home, hoje convertida em null. Mostrar erro/indisponibilidade e permitir retry; usar ‘sem jogos’ apenas após consulta bem-sucedida ao escopo.
- **Estado inicial:** PENDENTE. **Depende de:** IE-04.02.

### IE-04.04 — Separar descoberta e confirmação de transmissão

- [ ] Aplicar FutNaTV → mapa de direitos → grade/site oficial nominal. Registrar Brasil, data, competição, canal/plataforma, URL e hora de consulta. Evidência agregadora fica descoberta/a confirmar; validade não vem só de confidence.
- **Estado inicial:** PENDENTE. **Depende de:** IE-04.03.

### IE-04.05 — Resolver o fallback de fonte existente

- [ ] Registrar que futebol.tv.br está implementado; decidir com Kauê se permanece como descoberta complementar. Até o aceite da política, não promover essa fonte a prova oficial nem ampliar automaticamente a lista.
- **Estado inicial:** AGUARDANDO DECISÃO. **Depende de:** IE-04.04.

### IE-04.06 — Garantir atualização segura das evidências

- [ ] Substituir evidências por operação atômica ou publicação de versão completa. Simular falha entre DELETE e INSERT; preservar a última evidência válida com aviso de defasagem e manter confirmação oficial separada.
- **Estado inicial:** PENDENTE. **Depende de:** IE-04.05.

### IE-04.07 — Validar o contexto pré-jogo

- [ ] Conferir últimos jogos, mando, adversários, referência temporal do Elo, disponibilidade e comparabilidade dos indicadores. Informação do futuro não entra no contexto de uma partida passada; ausência não vira zero.
- **Estado inicial:** PENDENTE. **Depende de:** IE-04.06.

### IE-04.08 — Homologar a jornada de escolha de jogos

- [ ] Validar leitura no celular e desktop, busca/ordenamento/estados existentes e acesso às Anotações. Ajustes de favoritos, alertas ou calendário entram só se Kauê os escolher; registrar aceite do que foi entregue.
- **Estado inicial:** PENDENTE. **Depende de:** IE-04.07.

## IE-07 — Anotações pessoais e memória dos jogos

**Por que existe:** Guardar a visão de Kauê sobre os jogos com continuidade e privacidade; o histórico pessoal é parte central do hobby.

**Entrada:** IE-04.08.  
**Referências EBSA:** G4, G4.5, G5, G6, G6.5, G7.  
**Saída do capítulo:** Comentário, nota e campinho persistem com dono correto e podem ser recuperados.

### IE-07.01 — Validar entrada e fechamento da fila pós-jogo

- [ ] Conferir que só partidas encerradas elegíveis entram, sem duplicidade; jogos ao vivo continuam pendentes. Decidir se a fila automática corresponde aos jogos que Kauê quer anotar.
- **Estado inicial:** PENDENTE. **Depende de:** IE-04.08.

### IE-07.02 — Validar assistiu, não assistiu e transições

- [ ] Testar rascunho, conclusão e mudança de decisão. O código atual limpa notas quando ‘não assistiu’ e avaliações/marcas na finalização correspondente: homologar essa regra e proteger conteúdo existente antes de qualquer mudança.
- **Estado inicial:** PENDENTE. **Depende de:** IE-07.01.

### IE-07.03 — Separar avaliação pessoal de dado do provedor

- [ ] Mostrar de quem é cada nota, vínculo do jogador, participação e snapshot do provedor. Atleta que não jogou não recebe estatística inventada; a opinião de Kauê não altera o dado esportivo.
- **Estado inicial:** PENDENTE. **Depende de:** IE-07.02.

### IE-07.04 — Validar o campinho e sua persistência

- [ ] Testar coordenadas, jogador associado, comentário, recarga e redimensionamento. Conferir orientação do campo e acessibilidade; marca salva deve reaparecer no mesmo contexto.
- **Estado inicial:** PENDENTE. **Depende de:** IE-07.03.

### IE-07.05 — Validar gravação, conflitos e ownership

- [ ] Testar sessão expirada, falha de rede, duplo clique e duas abas. Mostrar confirmação apenas após persistência; impedir leitura/alteração de review alheio via chamada direta.
- **Estado inicial:** PENDENTE. **Depende de:** IE-07.04.

### IE-07.06 — Proteger histórico e portabilidade pessoal

- [ ] Definir retenção, exportação e restauração de comentários, notas e campinho. Desenhar exportação utilizável e validar uma amostra recuperada; exportar não equivale a backup restaurável.
- **Estado inicial:** PENDENTE. **Depende de:** IE-07.05.

### IE-07.07 — Homologar uma anotação completa com Kauê

- [ ] Escolher uma partida conhecida, registrar comentário, avaliações e campinho, sair/reentrar e conferir tudo. Medir esforço e incômodos; registrar aceite sem impor a obrigação de preencher todas as partidas.
- **Estado inicial:** PENDENTE. **Depende de:** IE-07.06.

## IE-06 — Elo confiável e exploração do histórico

**Por que existe:** Permitir explorar a força dos clubes e ligas sem perder a referência temporal ou interpretar ranking como certeza esportiva.

**Entrada:** IE-02.08.  
**Referências EBSA:** G4, G4.5, G5, G6, G6.5, G7.  
**Saída do capítulo:** Ranking, histórico e hierarquia reproduzíveis no banco atual, conforme a ordem de auditoria do AGENTS.

### IE-06.01 — Revalidar unicidade e fórmula do ranking atual

- [ ] Conferir uma linha atual por clube e continuidade em promoção/rebaixamento, preservando linhas locais históricas. Reutilizar a fórmula global = liga + (local − 1500) e a versão vigente; não recalcular no frontend.
- **Estado inicial:** PENDENTE. **Depende de:** IE-02.08.

### IE-06.02 — Revalidar freshness e fechamento diário

- [ ] Verificar importações por alvo, finalize, audit, último jogo processado e horário de corte. Diferenciar importação bem-sucedida de ranking fechado; manter ATTENTION visível quando a auditoria não for OK.
- **Estado inicial:** PENDENTE. **Depende de:** IE-06.01.

### IE-06.03 — Revalidar filtros, paginação e navegação

- [ ] Testar clube, região, país, liga, divisão, clube/liga, filtros combinados, reset, contagem e mais de 100 linhas. Ordenação/filtragem preserva posição global original.
- **Estado inicial:** PENDENTE. **Depende de:** IE-06.02.

### IE-06.04 — Revalidar a UX sem alterar o modelo

- [ ] Conferir tabela, escudos/fallback, seleção, densidade e celular. Mostrar data de atualização e os limites de interpretação; mudança visual não autoriza mudar fórmula.
- **Estado inicial:** PENDENTE. **Depende de:** IE-06.03.

### IE-06.05 — Concluir a auditoria point-in-time de 60 dias

- [ ] Validar ordem dos jogos, deltas e snapshots, inclusive correção/reprocessamento. História deve usar dados disponíveis no instante relevante; impedir uso do rating atual como se fosse passado.
- **Estado inicial:** PENDENTE. **Depende de:** IE-06.04.

### IE-06.06 — Auditar ranking de ligas e hierarquia

- [ ] Conferir evidência interligas, amostra, divisões e constraints. Explicitar ligas com evidência insuficiente; mudanças metodológicas exigem versão, regressão e evidência temporal/OOS quando aplicável.
- **Estado inicial:** PENDENTE. **Depende de:** IE-06.05.

### IE-06.07 — Executar o E2E final de Elo

- [ ] Na ordem do AGENTS: dados → filtros/ordenação → histórico → loading/erro/vazio → mobile/browser/acessibilidade. Associar resultado ao commit e ambiente atuais antes de concluir a trilha.
- **Estado inicial:** PENDENTE. **Depende de:** IE-06.06.

## IE-03 — Elencos, jogadores e coleta prospectiva

**Por que existe:** Construir dados individuais com cobertura demonstrada e orçamento sustentável, sem trocar uma base parcial por promessa de completude.

**Entrada:** IE-02.08.  
**Referências EBSA:** G5, G5.5, G6, G6.5, G7.  
**Saída do capítulo:** Elenco medido no banco novo e partida elegível atravessando o pipeline completo.

### IE-03.01 — Revalidar cobertura dos elencos após o remix

- [ ] Para as seis ligas prioritárias, conferir clubes esperados, mapeados, com elenco, com elenco conferido e fresco. Comparar snapshots de 19/09 e 04/10 sem tratá-los como o estado de 11/10.
- **Estado inicial:** NÃO VERIFICADO. **Depende de:** IE-02.08.

### IE-03.02 — Definir o significado de elenco completo

- [ ] Registrar referência comparável, categoria, temporada, número de atletas, atualização e critério de entrada/saída. ‘Tem alguma linha de elenco’ não equivale a elenco completo; divergência com o provedor fica explícita.
- **Estado inicial:** PENDENTE. **Depende de:** IE-03.01.

### IE-03.03 — Validar Dia Zero e escopo individual

- [ ] Confirmar day_zero_at do banco atual. Manter detalhamento por partida restrito às seis ligas e reconhecer IDs canônicos 5Dollar/API-Football; copas e segundas divisões continuam na agenda sem gerar detalhamento indevido.
- **Estado inicial:** PENDENTE. **Depende de:** IE-03.02.

### IE-03.04 — Validar uma partida em ponta a ponta

- [ ] Com DATA_RELEASE aplicável, selecionar fixture elegível: reconciliação → lineups → fixtures/players → estatísticas persistidas. Conferir ambos os times, atletas e chaves, sem chamar job SUCCEEDED de prova de conteúdo completo.
- **Estado inicial:** PENDENTE. **Depende de:** IE-03.03.

### IE-03.05 — Validar semântica individual

- [ ] Testar titular, entrou, banco/não jogou, minutos ausentes, nota ausente, expulsão e prorrogação quando disponíveis. Definir unidade e origem; ausência de dado não gera participação ou lesão presumida.
- **Estado inicial:** PENDENTE. **Depende de:** IE-03.04.

### IE-03.06 — Validar refresh e atualização de elenco

- [ ] Conferir transferências, atleta inativo, troca de número e duplicidades entre provedores. Preservar a identidade de eventos passados; alteração no elenco atual não apaga participação histórica.
- **Estado inicial:** PENDENTE. **Depende de:** IE-03.05.

### IE-03.07 — Conferir temporada e agregação prospectiva

- [ ] Verificar se o uso fixo de 2026/27 corresponde a cada competição, incluindo Brasil. Reconciliar sports_fixture_player_stats/sports_player_period_aggregates com as projeções consumidas; não inventar histórico anterior ao Dia Zero.
- **Estado inicial:** PENDENTE. **Depende de:** IE-03.06.

### IE-03.08 — Fechar o piloto e planejar expansão

- [ ] Entregar matriz de cobertura e custo, amostra validada, jobs pendentes e lacunas. Não impor ‘116/116 hoje’ nem completar de memória; novas ligas dependem de escolha de Kauê, quota, contrato e validação.
- **Estado inicial:** PENDENTE. **Depende de:** IE-03.07.

## IE-LP2 — Autoridade e consistência entre as camadas

**Por que existe:** Garantir que o que Kauê vê corresponde ao que o servidor persistiu, sem uma segunda versão da verdade em cada aba.

**Entrada:** IE-05.10, IE-04.08 e IE-07.07 para a R1.  
**Referências EBSA:** G4.5, G5, G6, G6.5, G7.  
**Saída do capítulo:** Leituras e gravações coerentes; regras sensíveis protegidas e versões rastreáveis.

### IE-LP2.01 — Mapear o caminho de cada dado até a tela

- [ ] Registrar dataset → transformação → read-model/RPC → server function → componente. Identificar divergência entre estatística prospectiva e player-season; escolher projeção canônica com período explícito.
- **Estado inicial:** PENDENTE. **Depende de:** IE-05.10, IE-04.08, IE-07.07.

Na R1, a revisão cobre Resenha, Hoje e Anotações. Reabrir as métricas e projeções quando Elo, elencos ou Analytics entrarem na candidata.

### IE-LP2.02 — Versionar métricas e manter paridade

- [ ] Mapear métricas atuais, unidades e regras. Se uma regra existir em mais de uma camada, testar paridade; cálculo de backend e representação visual usam a mesma definição.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP2.01.

### IE-LP2.03 — Garantir idempotência e publicação consistente

- [ ] Testar retries de ingestão, refinamento, sync e gravação pessoal. Proteger substituições com versões/transações apropriadas; falha parcial não publica conjunto como completo.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP2.02.

### IE-LP2.04 — Tratar identidade e atualização concorrente

- [ ] Conferir conflitos de IDs e duas gravações no mesmo recurso. Correção do provedor precisa de proveniência e política de reprocessamento, sem reescrever avaliação pessoal.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP2.03.

### IE-LP2.05 — Unificar estados de qualidade na UI

- [ ] Definir vocabulário visual consistente para atualizado, parcial, indisponível, fora do escopo e sem eventos. Conservar última leitura válida com aviso quando apropriado; erro nunca equivale a vazio.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP2.04.

### IE-LP2.06 — Auditar efeitos e acesso fora do navegador

- [ ] Revisar operações críticas diretamente por API/RPC, ownership, grants e cliente administrativo. Logs incluem correlação e resultado, com redaction e sem comentários pessoais desnecessários.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP2.05.

### IE-LP2.07 — Fechar a consistência integrada

- [ ] Reconciliar amostra de jogo/time/jogador entre Hoje, Anotações e Analytics, respeitando os limites próprios da Resenha e do Elo. Registrar versão, entradas, resultados, diferenças justificadas e rollback.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP2.06.

## IE-08 — Analytics com período, amostra e comparação

**Por que existe:** Explorar dados por interesse esportivo, sabendo exatamente quais partidas e jogadores sustentam cada comparação.

**Entrada:** IE-LP2.07 e IE-03.08.  
**Referências EBSA:** G4, G4.5, G5, G6, G6.5, G7.  
**Saída do capítulo:** Indicadores rastreáveis e comparáveis, sem confundir falta de histórico com pior desempenho.

### IE-08.01 — Corrigir a ponte entre coleta e superfície

- [ ] Verificar getAnalyticsTeamDetail, que lê sports_player_season_stats, contra a agregação prospectiva documentada. Demonstrar o caminho da partida coletada até minutos/aparições/titularidades exibidos; corrigir se faltar a ponte.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP2.07, IE-03.08.

### IE-08.02 — Definir períodos e temporadas por competição

- [ ] Permitir distinguir temporada oficial, intervalo selecionado e janela desde o Dia Zero. Brasil não herda automaticamente 2026/27; indicar o recorte efetivo e partidas incluídas.
- **Estado inicial:** PENDENTE. **Depende de:** IE-08.01.

### IE-08.03 — Validar métricas de equipes

- [ ] Reproduzir resultados, forma, casa/fora e métricas disponíveis com fonte, unidade e amostra. Comparação entre competições usa metodologia versionada; não assumir equivalência estatística por compartilhar rótulo.
- **Estado inicial:** PENDENTE. **Depende de:** IE-08.02.

### IE-08.04 — Validar métricas de jogadores

- [ ] Conferir aparições, titularidades, minutos, nota do provedor e demais indicadores disponíveis. Definir agregações, arredondamento e denominadores; métricas por 90 minutos, se aprovadas, exigem mínimo de exposição e teste.
- **Estado inicial:** PENDENTE. **Depende de:** IE-08.03.

### IE-08.05 — Separar falta de dado de baixa participação

- [ ] Estado de atleta/time explicita sem coleta, incompleto, não participou e zero observado. availability baseada só em ausência de erro não basta; mostrar cobertura, período e atualização.
- **Estado inicial:** PENDENTE. **Depende de:** IE-08.04.

### IE-08.06 — Validar filtros e consultas

- [ ] Conferir time, competição, elenco/jogador e recorte temporal existentes; testar combinação e limites/paginação com dataset representativo. Consultas não podem truncar dados e apresentar total completo.
- **Estado inicial:** PENDENTE. **Depende de:** IE-08.05.

### IE-08.07 — Homologar explorações úteis com Kauê

- [ ] Executar uma pergunta concreta sobre um time e uma sobre um atleta, conferindo os jogos que compõem a resposta. Registrar quais comparações ele quer usar; novo indicador entra por regra e versão, sem painel de números decorativos.
- **Estado inicial:** PENDENTE. **Depende de:** IE-08.06.

### IE-08.08 — Fechar a entrega analítica

- [ ] Entregar dicionário, contratos, testes, amostra de reconciliação e limites visíveis. Evidência incompleta mantém a função parcial/indisponível; não prometer predição nem garantia de desempenho.
- **Estado inicial:** PENDENTE. **Depende de:** IE-08.07.

## IE-LP3 — Auditoria das regras e das jornadas

**Por que existe:** Provar a experiência combinada e procurar números ou estados enganosos antes de liberar uma versão.

**Entrada:** IE-LP2.07, após os finais de Resenha, Hoje e Anotações.  
**Dependências adicionais por candidata:** candidata com Elo → IE-06.07; candidata com Analytics → IE-08.08.  
**Referências EBSA:** G7, G10.5.  
**Saída do capítulo:** Escopo da candidata auditado, resultados rastreáveis e nenhum bloqueador de integridade ou acesso.

### IE-LP3.01 — Definir a matriz de cenários da candidata

- [ ] Vincular cada regra homologada a caso positivo, negativo, limite e falha. Para candidata menor, registrar exatamente quais dependências deste plano pertencem ao escopo e quais ficam futuras; não marcar trilha futura como concluída.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP2.07.

### IE-LP3.02 — Validar o ciclo diário integrado

- [ ] Testar ontem/hoje/amanhã e virada de data: leitura editorial, contexto, transmissão, jogo encerrado e anotação. Usar partidas e horários sintéticos para falhas; conferir amostra real só no alvo autorizado.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP3.01.

### IE-LP3.03 — Validar independência dos provedores

- [ ] Simular SofaScore/RSS/5Dollar/API-Football/IA indisponíveis e quota esgotada. Uma falha deve afetar as funções correspondentes, com estados honestos; não completar narrativa ou estatística por memória.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP3.02.

### IE-LP3.04 — Executar gates de qualidade proporcionais

- [ ] Executar check, testes de domínio e banco aplicáveis, build, orçamento de performance e browsers/acessibilidade. Reutilizar CI vigente; não criar teste que apenas repete texto ou mascara falha.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP3.03.

### IE-LP3.05 — Validar recuperação e regressão

- [ ] Ensaiar restore no alvo isolado, continuidade das notas e reprocessamento de dados derivados. Verificar que o runtime de apostas não reaparece e que migrations arquivadas não são reaplicadas ao Cloud.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP3.04.

### IE-LP3.06 — Registrar achados e critérios de bloqueio

- [ ] Classificar AUDIT-0/1/2/3 e estado de evidência. Acesso indevido, perda de anotações, identidade errada, resultado/estatística inventados e falha exposta como ausência de evento bloqueiam a entrega afetada até resolução.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP3.05.

### IE-LP3.07 — Fechar o relatório de auditoria

- [ ] Associar cada achado a ação, teste, commit e ambiente; manter lacunas como não verificadas. G10.5 definitivo exige auditoria da candidata publicada após homologação; esta preparação não antecipa RELEASE_APPROVAL.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP3.06.

## IE-09 — Candidata, homologação e liberação

**Por que existe:** Fechar uma entrega verificável sem confundir PR aprovado com app disponível para Kauê.

**Entrada:** IE-LP3.07.  
**Referências EBSA:** G7, G8, G9, G10, G10.5, G11.  
**Saída do capítulo:** Versão identificada, aceita por Kauê e validada no destino correto.

### IE-09.01 — Fechar o escopo e conferir PR/CI

- [ ] Registrar commit, diff, dados/contratos afetados, gates reabertos e rollback. Branch → PR → checks obrigatórios verdes → merge conforme autorização existente; nunca declarar que este roadmap já realizou essas operações.
- **Estado inicial:** PENDENTE. **Depende de:** IE-LP3.07.

### IE-09.02 — Verificar sincronização e candidata restrita

- [ ] Confirmar commit no Lovable e no app candidato; testar acesso autorizado e negado. G8 mantém acesso restrito aos validadores; não mudar audiência/visibilidade como consequência automática do deploy.
- **Estado inicial:** PENDENTE. **Depende de:** IE-09.01.

### IE-09.03 — Resolver G9 conforme a decisão de réplica

- [ ] Se replica_enabled=true, testar direção PRIMARY → REPLICA, escopo e convergência antes/depois; se false confirmado, registrar N/A justificado. UNKNOWN continua bloqueando a dependência aplicável.
- **Estado inicial:** AGUARDANDO DECISÃO. **Depende de:** IE-09.02.

### IE-09.04 — Homologar com Kauê e auditar a candidata

- [ ] Executar as jornadas do escopo, registrar aceite G10 e refazer a auditoria G10.5 sobre a versão publicada. Para fatia menor, ajustar a matriz de dependências antes do fechamento, preservando os outros itens como pendentes.
- **Estado inicial:** PENDENTE. **Depende de:** IE-09.03.

### IE-09.05 — Registrar liberação e validar uso

- [ ] Emitir RELEASE_APPROVAL no escopo/audiência aprovado e observar login, leitura, atualização e persistência no ambiente real. Separar implementado, testado, mergeado, sincronizado, publicado e validado em produção.
- **Estado inicial:** PENDENTE. **Depende de:** IE-09.04.

## IE-10 — Operação sustentável do hobby

**Por que existe:** Manter o projeto prazeroso, econômico e recuperável, com tempo para acompanhar esportes em vez de administrar falhas.

**Entrada:** IE-09.05.  
**Referências EBSA:** G11, G12.  
**Saída do capítulo:** Rotina operacional documentada, sinais de falha úteis e decisões de expansão conscientes.

### IE-10.01 — Definir rotina leve de acompanhamento

- [ ] Criar verificação curta de resenha, agenda, Elo, fila e backups. Alertar apenas sobre falhas com ação clara; notificações/cadência novas dependem da preferência de Kauê.
- **Estado inicial:** PENDENTE. **Depende de:** IE-09.05.

### IE-10.02 — Medir qualidade e utilidade

- [ ] Acompanhar freshness, cobertura, falhas, correções e custo dos fluxos. Registrar também legibilidade da resenha, facilidade de escolher jogos e esforço para anotar; volume coletado não é o único resultado.
- **Estado inicial:** PENDENTE. **Depende de:** IE-10.01.

### IE-10.03 — Definir orçamento e expansão de cobertura

- [ ] Estabelecer teto de gasto mensal e chamadas, prioridade de ligas/categorias e tradeoffs com Kauê. Não contratar APIs, ampliar escopo ou ativar chamadas em massa por inferência.
- **Estado inicial:** AGUARDANDO DECISÃO. **Depende de:** IE-10.02.

### IE-10.04 — Documentar incidentes e retomada

- [ ] Runbooks para quota, provedor fora, vínculo incorreto, edição parcial, snapshot Elo antigo, login e restore. Registrar última leitura válida, causa, alvo, recuperação e próximo passo sem apagar histórico.
- **Estado inicial:** PENDENTE. **Depende de:** IE-10.03.

### IE-10.05 — Revalidar periodicamente os controles

- [ ] Aplicar cadência aprovada de restore, acessos, dependências, fontes e direitos. Mudança de regra/dataset/provedor invalida a evidência afetada; a data sozinha não torna uma prova atual.
- **Estado inicial:** PENDENTE. **Depende de:** IE-10.04.

### IE-10.06 — Manter backlog pessoal e checkpoints

- [ ] Separar manutenção necessária de novas ideias escolhidas por Kauê. Uma entrega utilizável por vez, com pausa/retomada registradas; sem criar obrigação de assistir, anotar ou concluir o roadmap em prazo arbitrário.
- **Estado inicial:** PENDENTE. **Depende de:** IE-10.05.

### IE-10.07 — Prever encerramento ou migração futura

- [ ] G12 só se houver decisão de desativar. Planejar exportação/restore, destino das anotações, revogação de acessos e desligamento de jobs/serviços; mudança de conta precisa de diagnóstico e validação completos.
- **Estado inicial:** PENDENTE. **Depende de:** IE-10.06.

## 8. Mapa de gates, recibos e fechamento

| Gate(s) EBSA | Onde são trabalhados | Prova exigida |
| --- | --- | --- |
| I-1, I0, I0.5 | IE-00 | Fronteira de confiança, identidade e perfil preliminar |
| G0 | IE-00 / IE-LP1 | Intenção pessoal, escopo da candidata e resultado desejado |
| G1 | IE-01.01 | Viabilidade e executor de schema testados no alvo isolado |
| G2, G3 | IE-00 / IE-01 / IE-09 | GitHub-first, fluxo de mudança e documentação atual |
| G3.25, G3.5 | IE-00.05 / IE-00.06 | Perfil confirmado, privacidade e ameaças |
| G4, G4.5 | Trilhas de interface e IE-LP3 | Jornadas, estados, contratos e cliente |
| G5, G5.25 | IE-01 / IE-LP2 | Backend, integridade, autorização e governança |
| G5.5 | IE-01.07 | Fundação, capacidade e recuperação comprovadas |
| G6, G6.5 | IE-02 e contratos das trilhas | Contratos, regras homologadas e DATA_RELEASE do fluxo |
| G7 | IE-LP3 e CI do escopo | Qualidade integrada para a versão candidata |
| G8 | IE-09.02 | Candidata identificada e restrita |
| G9 | IE-09.03 | Replicação se ativa; N/A só com false comprovado |
| G10 | IE-09.04 | Aceite de Kauê das jornadas da candidata |
| G10.5 | IE-09.04 | Auditoria final da candidata, sem bloqueador |
| G11 | IE-09.05 / IE-10 | Liberação e operação comprovadas |
| G12 | IE-10.07, quando houver desativação | Destino de dados, revogações e recursos encerrados |

### Recibos e regras de aprovação

- **DATA_RELEASE:** para dataset/fluxo/versão/alvo e plano registrados; depende de perfil, privacidade, fundação, contrato e regras aplicáveis. Este documento não autoriza nova carga real.
- **Executor de schema:** desconhecido impede aplicação remota; desenho e testes locais isolados podem continuar.
- **RELEASE_APPROVAL:** ocorre após G8, G10 e G10.5 da candidata, com público/usuário autorizado e versão identificados.
- **G9:** se réplica for comprovadamente desativada, N/A justificado satisfaz a dependência condicional. UNKNOWN não vira false.
- **Dados já existentes:** registrar situação, evidência e plano de regularização; não fabricar recibos/ensaios anteriores. Este planejamento não desliga nem reconfigura os jobs em operação.
- **Mudança material:** reabrir gates e invalidar evidência afetada por regra, dataset, fonte, backend, acesso, volume ou público.
- **Testes de carga, stress e restore:** somente ambiente isolado/descartável; provedores e efeitos externos simulados quando necessário. Smoke compartilhado é delimitado.
- **Pausa do hobby:** registrar checkpoint. Não confundir pausa com encerramento G12 nem apagar histórico por conveniência.

### Evidência mínima por ação concluída

Registrar ação, candidata/escopo, gate afetado, commit, ambiente, data/hora, método, resultado, localização da prova, responsável e se o cenário foi simulado. Usar PASS, FAIL, UNVERIFIED ou N/A justificado conforme o núcleo; uma imagem da tela sozinha não demonstra banco, permissionamento ou completude.

O encerramento também registra: alterações realizadas, o que foi validado, limitações, documentação atualizada, pendências e próximo passo exato. Ações que atravessam release precisam da referência à candidata correta; uma marca de “concluído” da R1 não comprova a R3.

### Critério global de conclusão de uma candidata

A candidata pode ser fechada quando seu escopo foi aceito por Kauê, as regras aplicáveis possuem exemplos e testes, dados/estado exibidos são rastreáveis, permissões foram demonstradas, histórico pessoal permanece íntegro, recuperação está ensaiada e publicação corresponde ao commit validado. Nenhum item material não verificado pode ser apresentado como aprovação.

## 9. Cadastro no armário da agenda

O modelo consultado usa ProjectPlan com projectKey, chapters/actions e executionSteps, além de dependsOn, defaultStatus, statusMode e baseline opcionais.

Projeção cadastrada em 11/10/2026:

| Campo da agenda | Valor / regra |
| --- | --- |
| projectKey | INTELIGENCIA_ESPORTIVA — projeto independente em PROJECT_PLANS |
| title | Inteligência Esportiva — Roadmap pessoal e operacional |
| version / date | 1.0 · EBSA 1.7 / 2026-10-11 |
| statusMode | true, usando o vocabulário de estados já existente |
| chapters | Os 14 capítulos IE deste documento, na ordem de leitura |
| actions | Os 104 códigos estáveis, com detalhes e estado inicial |
| dependsOn | As dependências explícitas das ações; conferir o escopo de candidata e condições de Elo/Analytics antes de projetar |
| executionSteps | R1: IE-00 → LP1 → IE-01 → IE-02 → IE-05 → IE-04 → IE-07 → LP2 → LP3 → IE-09 → IE-10. Depois: IE-06 → IE-03 → IE-08 |
| baseline | Identidade, escopo, limitações e referências da leitura inicial |

Os códigos devem ser estáveis para preservar progresso. Reordenar apresentação não renomeia ações. Evidência/aceite de cada candidata exige registro próprio; o percentual da agenda é apenas acompanhamento de trabalho.

**Fonte na agenda:** docs/roadmap/INTELIGENCIA_ESPORTIVA_ROADMAP_EBSA_v1_7.md. Projeção em src/data/inteligencia-esportiva-project-plan.ts, registrada em PROJECT_PLANS com chave própria.

O armário está disponível em Ajustes para consultar os roadmaps cadastrados. O cadastro não cria blocos nem reserva horários. O progresso e os dados manuais da agenda são preservados. A interface acrescenta as três verificações transversais de qualidade de UX já aplicadas aos demais projetos.

## 10. Referências e rastreabilidade

As páginas abaixo foram lidas na baseline indicada, exceto a API de checks, consultada para o commit específico. Elas sustentam o diagnóstico dirigido; não são atestados do runtime atual.

| Referência | Origem |
| --- | --- |
| Framework EBSA 1.7 | Pacote anexado APOSTILAS_FRAMEWORK_EBSA_v1_7(5).zip; núcleo YAML, matrizes, manual e modelos |
| Modelo da agenda | [src/lib/project-plan-types.ts](https://github.com/kauefsantos12-creator/agenda/blob/111b66dbd84da2cdfe224183f4457d81161482fd/src/lib/project-plan-types.ts) |
| Roadmap pessoal/operacional da NAT | [docs/roadmap/NAT_DIAGNOSTICO_E_ROADMAP_EBSA_v1_7.md](https://github.com/kauefsantos12-creator/agenda/blob/111b66dbd84da2cdfe224183f4457d81161482fd/docs/roadmap/NAT_DIAGNOSTICO_E_ROADMAP_EBSA_v1_7.md) |
| Roadmap Geo Insights | [docs/roadmap/ROADMAP_BRASIL_GEO_INSIGHTS_v1_0.md](https://github.com/kauefsantos12-creator/agenda/blob/111b66dbd84da2cdfe224183f4457d81161482fd/docs/roadmap/ROADMAP_BRASIL_GEO_INSIGHTS_v1_0.md) |
| Projeção do roadmap na agenda | [nat-project-plan](https://github.com/kauefsantos12-creator/agenda/blob/111b66dbd84da2cdfe224183f4457d81161482fd/src/data/nat-project-plan-2026-09-28.ts) e [ProjectPlanPanel](https://github.com/kauefsantos12-creator/agenda/blob/111b66dbd84da2cdfe224183f4457d81161482fd/src/components/agenda/ProjectPlanPanel.tsx) |
| Regras do repositório | [AGENTS.md](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/blob/4696c8eb400a088b226dce0653eb775b64383490/AGENTS.md) |
| Estado canônico | [docs/PROJECT_STATE.md](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/blob/4696c8eb400a088b226dce0653eb775b64383490/docs/PROJECT_STATE.md) |
| Identidade divergente | [README.md](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/blob/4696c8eb400a088b226dce0653eb775b64383490/README.md) |
| Arquitetura a atualizar | [docs/ARCHITECTURE.md](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/blob/4696c8eb400a088b226dce0653eb775b64383490/docs/ARCHITECTURE.md) |
| Governança a atualizar | [docs/GOVERNANCE.md](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/blob/4696c8eb400a088b226dce0653eb775b64383490/docs/GOVERNANCE.md) |
| Reescopo do produto | [docs/governance/SPORTS_INTELLIGENCE_RESCOPE_2026-09-15.md](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/blob/4696c8eb400a088b226dce0653eb775b64383490/docs/governance/SPORTS_INTELLIGENCE_RESCOPE_2026-09-15.md) |
| Recuperação do remix | [docs/governance/REMIX_RECOVERY_2026-10-04.md](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/blob/4696c8eb400a088b226dce0653eb775b64383490/docs/governance/REMIX_RECOVERY_2026-10-04.md) |
| Recuperação agenda/Elo | [docs/governance/PLATFORM_DATA_RECOVERY_2026-10-04.md](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/blob/4696c8eb400a088b226dce0653eb775b64383490/docs/governance/PLATFORM_DATA_RECOVERY_2026-10-04.md) |
| Pacing dos elencos | [docs/governance/SQUAD_COLLECTION_PACING_2026-10-04.md](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/blob/4696c8eb400a088b226dce0653eb775b64383490/docs/governance/SQUAD_COLLECTION_PACING_2026-10-04.md) |
| Dia Zero e agregação | [docs/governance/STAGE4_PROSPECTIVE_FIXTURE_COLLECTION_2026-09-19.md](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/blob/4696c8eb400a088b226dce0653eb775b64383490/docs/governance/STAGE4_PROSPECTIVE_FIXTURE_COLLECTION_2026-09-19.md) |
| Padrão editorial aprovado | [docs/governance/EDITORIAL_REVIEW_STANDARD_2026-10-05.md](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/blob/4696c8eb400a088b226dce0653eb775b64383490/docs/governance/EDITORIAL_REVIEW_STANDARD_2026-10-05.md) |
| Política implementada | [src/lib/sports/editorial-policy.ts](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/blob/4696c8eb400a088b226dce0653eb775b64383490/src/lib/sports/editorial-policy.ts) |
| Refinamento da resenha | [src/lib/sports/editorial-ai-refinement.server.ts](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/blob/4696c8eb400a088b226dce0653eb775b64383490/src/lib/sports/editorial-ai-refinement.server.ts) |
| Home e programação | [src/routes/index.tsx](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/blob/4696c8eb400a088b226dce0653eb775b64383490/src/routes/index.tsx) |
| Sync de transmissão | [src/lib/sports/futnatv-broadcast-sync.server.ts](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/blob/4696c8eb400a088b226dce0653eb775b64383490/src/lib/sports/futnatv-broadcast-sync.server.ts) |
| Analytics de equipe | [src/lib/analytics-overview.functions.ts](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/blob/4696c8eb400a088b226dce0653eb775b64383490/src/lib/analytics-overview.functions.ts) |
| Gravação de anotações | [src/lib/notes-overview.functions.ts](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/blob/4696c8eb400a088b226dce0653eb775b64383490/src/lib/notes-overview.functions.ts) |
| Autorização no servidor | [src/integrations/supabase/auth-middleware.ts](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/blob/4696c8eb400a088b226dce0653eb775b64383490/src/integrations/supabase/auth-middleware.ts) |
| Worker de dados | [src/lib/sports/sports-job-worker.server.ts](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/blob/4696c8eb400a088b226dce0653eb775b64383490/src/lib/sports/sports-job-worker.server.ts) |
| CI | [Checks do commit-base](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/commit/4696c8eb400a088b226dce0653eb775b64383490/checks) |

**Integridade da referência EBSA:** SHA-256 do núcleo anexado = bcc705c77cd17d169f92694aab83bdae43fc73ef539c23a1677239a851863e30, correspondente às matrizes do pacote. A igualdade de hash comprova identidade dos bytes, não conformidade do projeto.

## 11. Ordem inicial e próximo passo

IE-00.01 e IE-00.02 estão integradas. Kauê escolheu **Resenha diária** em IE-00.03. Após integrar esse registro, seguir para **IE-00.04**: mapear o que existe, o que funciona no ambiente atual e as lacunas de cada superfície, destacando as que afetam a resenha. Presença no código e registro histórico não substituem verificação atual.

O primeiro avanço técnico observável será uma baseline coerente: endereço certo, banco certo, escopo certo e lista honesta do que já funciona. A partir dela, corrigir a programação que confunde falha com vazio e validar uma edição editorial completa, mantendo as suas anotações protegidas.


## Execução — IE-00.01 — 11/10/2026

**Resultado:** identidade da fase de desenvolvimento confirmada. Kauê definiu execução por commits em kauefsantos12-creator/intelig-ncia-esportiva e confirmou que não há endereço público nesta fase. A ausência de URL não bloqueia esta ação.

| Campo | Valor verificado |
| --- | --- |
| Repositório / branch | kauefsantos12-creator/intelig-ncia-esportiva / main |
| Baseline consultada | 4696c8eb400a088b226dce0653eb775b64383490 |
| Projeto Lovable conectado | 428fa571-e363-4bbf-ab2c-058451eba7dc |
| Workspace | a6f6ab0ce77b5538cbf7 |
| Código conectado na consulta | Mesmo SHA da baseline do GitHub |
| PRIMARY configurado | Lovable Cloud — hefuvmocohhpmnhwpkac |
| Conectividade | SELECT no projeto respondeu às 21:24:34 de Brasília; sports_fixtures e sports_match_reviews presentes |
| Endereço público | NÃO SE APLICA nesta fase, confirmado por Kauê |

A evidência detalhada e os limites estão em [IE_00_01_PROJECT_IDENTITY_2026-10-11.md](../governance/IE_00_01_PROJECT_IDENTITY_2026-10-11.md). README e PROJECT_STATE passam a apontar para o projeto atual. O CI da primeira proposta revelou dependências vulneráveis; a atualização corretiva foi incluída na PR #19 para permitir a integração com os checks preservados.

**Progresso desta execução:** 1 de 104 ações de origem concluída no escopo de identidade. Isso não mede cobertura de dados nem aprovação de capítulo, candidata ou serviço. A conclusão da ação não declara publicação/homologação da aplicação.

**Próxima ação:** IE-00.02 — separar estado atual de histórico. Não foi executada nesta entrega. A revisão integral de ARCHITECTURE, GOVERNANCE e registros operacionais permanece para ela.

**Controle de integração:** [PR #19](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/pull/19); merge somente após CI obrigatório aprovado. A PR #9 da agenda foi encerrada sem merge. Sem mensagem ao agente Lovable, deploy, migration ou alteração de dados pessoais.

## Execução — IE-00.02 — 15/10/2026

README, ARCHITECTURE, GOVERNANCE, PROJECT_STATE e índice documental foram reconciliados com a main `868c13ac99c92bfdf202c6ace64f3ebe85e5b1b1`. Os textos anteriores de arquitetura, governança e estado foram preservados integralmente após aviso em `docs/history/ie-00-02-2026-10-15/`.

Contagens de 19/09, 20/09 e 04/10 conservam data e ambiente; não certificam o PRIMARY atual. A antiga pendência de restaurar migrations foi corrigida no escopo Git: 135 arquivos históricos arquivados e duas migrations novas; aplicação no Cloud não comprovada nesta ação.

Verificações locais: preservação dos três corpos, links locais de 11 documentos, referências de código, inventário de migrations, diff sem erro de whitespace, lint sem erros (avisos existentes), tipagem e fronteiras de arquitetura aprovados. A revisão é exclusivamente documental, sem alteração de runtime, banco, fontes ou dados pessoais. CI remoto e commit integrado são registrados na PR; vigência na main depende de todos os gates obrigatórios verdes e merge confirmado.

**Progresso documental nesta revisão:** IE-00.01 e IE-00.02, duas de 104 ações de origem; não mede cobertura nem aprovação do capítulo ou serviço. Evidência: `docs/governance/IE_00_02_CURRENT_STATE_HISTORY_2026-10-15.md`.

**Próxima ação após integração:** IE-00.03 — definir com Kauê a experiência pessoal prioritária. Nenhuma preferência adicional foi presumida.

## Execução — IE-00.03 — 15/10/2026

Kauê respondeu **“Resenha”** à pergunta sobre qual rotina melhorar primeiro: resenha diária, escolha dos jogos ou anotações. A prioridade funcional é **Resenha diária / Noticiário (IE-05)**. Preservam-se os princípios pessoais já registrados: prazer de uso, confiança no conteúdo e memória esportiva.

A decisão orienta a baseline e as melhorias: cobertura dos acontecimentos elegíveis, explicação nos três eixos aprovados, fatos rastreáveis e leitura clara. São objetivos de validação, não qualidades já comprovadas. O ciclo R1 completo segue como proposta; o escopo concreto da candidata será fechado em IE-LP3.01. Mantidas a base comum, as dependências, as fontes e a proteção das anotações.

Evidência: [IE_00_03_REVIEW_PRIORITY_2026-10-15.md](../governance/IE_00_03_REVIEW_PRIORITY_2026-10-15.md). Mudança documental; CI e integração registrados na PR correspondente. **Três de 104 ações de origem no escopo desta revisão**, sem homologar capítulo, edição, candidata ou runtime. **Próxima: IE-00.04 — baseline de cada superfície**, com atenção às lacunas da Resenha.
