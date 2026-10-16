# Motor de Inteligência Esportiva — estado canônico

> Revisão: 15/10/2026, IE-00.04. Baseline consultada: main `6d78f07f9689b4c31ca1bd76189c970e6c30c949`.
> Fase definida por Kauê: desenvolvimento por commits, sem endereço público nesta preparação.

## Identidade e fontes de verdade

| Item | Referência | Evidência e limite |
| --- | --- | --- |
| Código canônico | `kauefsantos12-creator/intelig-ncia-esportiva`, main | Consultado em 15/10/2026 |
| Projeto Lovable | `428fa571-e363-4bbf-ab2c-058451eba7dc`; workspace `a6f6ab0ce77b5538cbf7` | Consultado em 15/10; latest_commit_sha igual à main da baseline |
| PRIMARY configurado | Lovable Cloud `hefuvmocohhpmnhwpkac` | Configuração confirmada no projeto conectado e consultas SELECT atuais em 15/10 |
| Publicação | Não se aplica à preparação atual | Decisão de Kauê em 11/10; homologação/publicação pertencem à entrega correspondente |
| Tempo | `America/Sao_Paulo` | Referência operacional |

GitHub governa código, contratos, testes, migrations e documentação. Lovable Cloud governa dados e operação vivos. Configuração, sincronização e disponibilidade são evidências distintas.

`quant-football-insights`, Lovable `28664075-…`, banco `vsygkpwptoppbrlnrpcp` e URLs anteriores pertencem ao histórico. Não criar outro projeto para continuar este produto.

`implementado ≠ testado ≠ mergeado ≠ sincronizado ≠ publicado ≠ validado em produção`.

**Código verificado** significa presença/estrutura observada na baseline. **Registro histórico** conserva data e ambiente. **Não verificado** não equivale a zero, cobertura completa ou aprovação.

## Produto e implementação observada

Central pessoal de inteligência esportiva, com Resenha como prioridade. Levantamento somente leitura em 15/10/2026, aproximadamente 20:58–21:04 BRT; data UTC passou a 16/10. Código e dados foram confrontados, mas nenhuma jornada autenticada foi homologada.

| Superfície | Referência no código | Baseline atual e limite |
| --- | --- | --- |
| Noticiário | `src/routes/index.tsx`, `src/lib/news-overview.functions.ts` | Seis edições de 09 a 14/10 FAILED por ausência de itens; última PUBLISHED em 08/10 com um item |
| Hoje | `src/routes/hoje.tsx`, `src/lib/today-overview.functions.ts` | Zero fixtures registradas para 14/10 e 15/10 locais; catálogo defasado não prova ausência de jogos |
| Elo | `src/routes/elo.tsx`, `src/lib/elo-explorer.functions.ts` | 676 clubes únicos; sync PARTIAL em 15/10; completude e jornadas não homologadas |
| Anotações | `src/routes/anotacoes.tsx`, `src/lib/notes-overview.functions.ts` | 170 reviews AUTO_CLOSED; zero preenchimento pessoal nas contagens consultadas; persistência/restore não exercitados |
| Analytics | `src/routes/analytics.tsx`, `src/lib/analytics-overview.functions.ts` | 247 linhas individuais em seis fixtures e 247 agregados por período, mas player-season e standings vazios; detalhe ainda lê player-season |
| Conta/Privacidade | Rotas próprias e middleware | Uma conta Google, funções de controle e RLS observados; login e isolamento por recurso não testados |

A [baseline completa](governance/IE_00_04_SURFACE_BASELINE_2026-10-15.md) registra consultas, contagens, fontes, horários e lacunas. A ação IE-00.04 registra a situação; não conclui auditorias funcionais.
## Roadmap

- **IE-00.01 — CONCLUÍDA no escopo de identidade:** PR #19 integrada na main `868c13ac99c92bfdf202c6ace64f3ebe85e5b1b1`. [Evidência datada](governance/IE_00_01_PROJECT_IDENTITY_2026-10-11.md). Ajustes de dependências necessários ao CI integram essa entrega histórica.
- **IE-00.02 — CONCLUÍDA no escopo documental desta revisão:** documentos vigentes separados dos snapshots históricos e verificações locais aprovadas. [Evidências e limites](governance/IE_00_02_CURRENT_STATE_HISTORY_2026-10-15.md). Vigência na main exige gates aprovados e merge confirmado na PR correspondente.
- **IE-00.03 — CONCLUÍDA no escopo da decisão desta revisão:** Kauê escolheu **Resenha diária** em 15/10/2026. Primeiro foco funcional: Noticiário/IE-05, após a base comum. [Evidência da escolha](governance/IE_00_03_REVIEW_PRIORITY_2026-10-15.md). Integração por PR com gates verdes.
- **IE-00.04 — CONCLUÍDA no escopo de inventário desta revisão:** [baseline das superfícies](governance/IE_00_04_SURFACE_BASELINE_2026-10-15.md), com evidência atual, falhas e limites. Integração por PR com gates verdes.
- **Próxima após integração: IE-00.05 — confirmar o PROJECT_PROFILE.** A prioridade Resenha orienta os próximos controles e a recuperação futura do worker.

O [roadmap EBSA 1.7](roadmap/INTELIGENCIA_ESPORTIVA_ROADMAP_EBSA_v1_7.md) mantém códigos e dependências. Esta revisão não fecha IE-00, o perfil ou gates de liberação.

## Dados e coleta: desenho não equivale a cobertura atual

Os dados abaixo são snapshots do PRIMARY em 15/10/2026, não percentuais de homologação.

| Fluxo | Medição atual | Limite |
| --- | --- | --- |
| Catálogo | 94 competições ativas, 939 equipes, 584 fixtures; última coleta efetiva de fixture em 08/10 às 15:00 BRT | Conjunto oficial externo não confrontado |
| Elencos | 86/116 clubes do piloto com linhas ativas; 2.776 linhas, última coleta em 06/10 | Linhas não provam elenco completo ou atualizado |
| Prospectivo | Dia Zero em 04/10 às 14:51 BRT; seis fixtures com estatísticas individuais | Coleta recente parada desde 08/10; escopo/temporada ainda exigem validação |
| Editorial | 289 evidências e 315 fact packs; últimas coletas em 08/10; seis edições recentes FAILED | Qualidade e completude da edição atual indisponíveis |
| Transmissão | 40 evidências, última checagem em 08/10 às 19:17 BRT | Desatualizado; confirmação nominal continua pendente |
| Automação | 20 crons ativos, 96 jobs vencidos; 385 respostas retidas com 404 “Project not found”; configuração do worker no endereço antigo | Cron succeeded não prova sucesso HTTP; automation_runs vazio impede atribuição por requisição |
| Elo | 676 clubes únicos e sync PARTIAL em 15/10 | Timestamp e unicidade não homologam ranking ou histórico |

A principal hipótese de bloqueio é o destino antigo do worker. Recuperação e prova ponta a ponta pertencem a IE-01.01/04, IE-02.06 e IE-05.01; nada foi reconfigurado nesta baseline. A ordem e as dependências vigentes continuam as do roadmap; elencos incompletos não bloqueiam automaticamente uma resenha útil.
### Contagens históricas

| Registro | Data e origem | Limite |
| --- | --- | --- |
| 116/116 clubes com elencos | 19/09; banco anterior ao remix | Não comprova cobertura do PRIMARY novo |
| 681 clubes, 32 ligas e 9 continentais | 20/09; auditoria Elo anterior ao remix | Não é o ranking de hoje |
| 27 jogos prioritários, 54 equipes, 123 evidências em 74 fixtures | 20/09; auditoria Hoje anterior ao remix | Não comprova agenda/transmissão atuais |
| 15 clubes com linhas de elenco, 676 clubes Elo | 04/10; [SQUAD_COLLECTION_PACING](governance/SQUAD_COLLECTION_PACING_2026-10-04.md), PRIMARY após recuperação | Linhas não provam elenco completo; contagens não renovadas |
| 20 jobs recuperados | 04/10; [REMIX_RECOVERY](governance/REMIX_RECOVERY_2026-10-04.md) | Não comprova configuração/execução hoje |

Auditorias, medições e PRs do texto anterior estão no [snapshot integral](history/ie-00-02-2026-10-15/PROJECT_STATE.md). Números de PR do repositório antigo não devem ser resolvidos por suposição no novo.

## Remix, migrations e recuperação

O remix de 01/10 (`f600756`) mudou conta/projeto e PRIMARY. A recuperação de 04/10 registrou restauração do middleware, configurações, jobs e carga inicial. Os relatórios preservam suas datas em [REMIX_RECOVERY](governance/REMIX_RECOVERY_2026-10-04.md) e [PLATFORM_DATA_RECOVERY](governance/PLATFORM_DATA_RECOVERY_2026-10-04.md).

**Inventário nesta baseline:** 135 SQLs em `supabase/migrations_archive/` e duas migrations editoriais novas em `supabase/migrations/`. O arquivo histórico já está restaurado no Git; a antiga pendência de restaurá-lo deixou de se aplicar. O CI recompõe o histórico para reconstrução isolada e regressões. Não reaplicar automaticamente no Cloud nem editar a tabela de migrations.

Executor remoto, aplicação das migrations novas e correspondência entre Git e schema vivo continuam não verificados. Scripts de recuperação são procedimentos contextualizados, não autorização de execução.

## Pendências preservadas

- IE-04.03: falha da programação na Home pode virar “Sem jogos previstos”; não é ausência real comprovada.
- IE-04.04–06: agregador não prova transmissão oficial; substituição de evidências precisa de integridade/recuperação.
- IE-03/IE-08: revalidar identidade de competição, escopo individual, titularidades, quota e coleta completa. Relato antigo de correção não demonstra estado atual.
- IE-LP2/IE-08: reconciliar player-season e estatísticas por fixture; conferir `2026/27` por competição.
- IE-01/IE-06: comprovar acesso, permissões, backup/restore, capacidade e Elo.
- IE-00.05/06: perfil, responsáveis, tolerância de perda e classificação dos dados continuam abertos.

## Continuidade

1. Consultar main, README, este documento e a ação do roadmap.
2. Confrontar referências no código; consultar projeto conectado quando sincronização for relevante.
3. Para dados, jobs, acesso e schema, obter evidência fresca do PRIMARY; declarar limites do que não foi verificado.
4. Seguir branch → alteração → PR → gates verdes → merge, preservando história publicada.
5. Registrar integração e validar sincronização/publicação no escopo da entrega.
6. Preservar memória pessoal e evidências datadas; não converter percentuais antigos em cobertura atual.

## Entrega prioritária — primeiro relato em 16/10/2026 às 20h

Kauê pediu implementação funcional para seu primeiro jogo às 20h de São Paulo, antecipando o fluxo pessoal sem fechar os campos pendentes do PROJECT_PROFILE/IE-00.05 (PR #23 em rascunho). Foi constatado zero fixtures armazenadas para 16/10; a coleta automática não foi recuperada nesta entrega.

Relatos pessoais foram integrados em Anotações pela [PR #24](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/pull/24): informar times, competição opcional, data/hora de Brasília e texto; salvar, reabrir e editar antes, durante ou depois do jogo. Dados pessoais ficam em tabela própria, sem fabricar fixtures oficiais ou métricas. Login aprovado, RLS e RPC invoker permanecem obrigatórios. Repetir uma gravação após perda da resposta é idempotente; versão desatualizada não sobrescreve o relato.

Merge `5983b66cb0214e0208b57c2d238524377ef2e19a` sincronizado ao Lovable. Quatro checks aprovados: 249 testes SQL, 227 unitários, matriz de navegador com 63 PASS e 9 skips existentes, build/budget/smoke aprovados. Migration `20261016123224_personal_match_reports.sql` aplicada no PRIMARY pelo executor SQL conectado. RLS/grants/índice/FK/RPC e ensaio transacional de criação/leitura/edição/retry/conflito/identidade aprovados; rollback confirmado sem linhas sintéticas e sem alterar as 584 fixtures. Consultar o [registro de entrega](governance/FIRST_MATCH_REPORT_2026-10-16.md) para método, hash e data.

Publicação não executada; a prévia sem sessão retornou HTTP 403 e o login Google/salvamento pela UI real ainda não foram homologados. Código integrado e persistência comprovada não encerram esse aceite. A fila pós-jogo, notas e campinho existentes continuam disponíveis. Nenhum capítulo do roadmap é fechado por esta entrega parcial.
