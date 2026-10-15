# Motor de Inteligência Esportiva — estado canônico

> Revisão: 15/10/2026, IE-00.03. Baseline consultada: main `77cb71654a2b5f755630b5f6a8089220480e0225`.
> Fase definida por Kauê: desenvolvimento por commits, sem endereço público nesta preparação.

## Identidade e fontes de verdade

| Item | Referência | Evidência e limite |
| --- | --- | --- |
| Código canônico | `kauefsantos12-creator/intelig-ncia-esportiva`, main | Consultado em 15/10/2026 |
| Projeto Lovable | `428fa571-e363-4bbf-ab2c-058451eba7dc`; workspace `a6f6ab0ce77b5538cbf7` | Registrado na IE-00.01 em 11/10; sincronização de hoje não consultada |
| PRIMARY configurado | Lovable Cloud `hefuvmocohhpmnhwpkac` | Conectividade SQL observada em 11/10; sem nova consulta nesta revisão |
| Publicação | Não se aplica à preparação atual | Decisão de Kauê em 11/10; homologação/publicação pertencem à entrega correspondente |
| Tempo | `America/Sao_Paulo` | Referência operacional |

GitHub governa código, contratos, testes, migrations e documentação. Lovable Cloud governa dados e operação vivos. Configuração, sincronização e disponibilidade são evidências distintas.

`quant-football-insights`, Lovable `28664075-…`, banco `vsygkpwptoppbrlnrpcp` e URLs anteriores pertencem ao histórico. Não criar outro projeto para continuar este produto.

`implementado ≠ testado ≠ mergeado ≠ sincronizado ≠ publicado ≠ validado em produção`.

**Código verificado** significa presença/estrutura observada na baseline. **Registro histórico** conserva data e ambiente. **Não verificado** não equivale a zero, cobertura completa ou aprovação.

## Produto e implementação observada

Central pessoal de inteligência esportiva, sem jornada ativa de apostas, odds, banca, picks ou execução financeira. Reescopo de setembro e remix de outubro são eventos distintos; implementação anterior não comprova os dados do PRIMARY novo.

| Superfície | Referência no código | Ambiente atual |
| --- | --- | --- |
| Noticiário | `src/routes/index.tsx`, `src/lib/news-overview.functions.ts`; `editorial-explanatory-v3` | Edição completa e cobertura não revalidadas |
| Hoje | `src/routes/hoje.tsx`, `src/lib/today-overview.functions.ts`; programação também na Home | Completude e confirmação oficial de transmissão não revalidadas |
| Elo | `src/routes/elo.tsx`, `src/lib/elo-explorer.functions.ts` | Cobertura, freshness e histórico não revalidados |
| Anotações | `src/routes/anotacoes.tsx`, `src/lib/notes-overview.functions.ts` | Ownership, continuidade e restore não revalidados |
| Analytics | `src/routes/analytics.tsx`, `src/lib/analytics-overview.functions.ts`; consulta a player-season | Reconciliação com coleta por fixture e temporada por competição pendentes |
| Conta/Privacidade | Rotas próprias e middleware Google/allowlist/prazo de sessão | Acesso por recurso não ensaiado nesta ação |

Esta leitura não conclui IE-00.04 nem auditorias funcionais. Ver [arquitetura](ARCHITECTURE.md) e [governança](GOVERNANCE.md).

## Roadmap

- **IE-00.01 — CONCLUÍDA no escopo de identidade:** PR #19 integrada na main `868c13ac99c92bfdf202c6ace64f3ebe85e5b1b1`. [Evidência datada](governance/IE_00_01_PROJECT_IDENTITY_2026-10-11.md). Ajustes de dependências necessários ao CI integram essa entrega histórica.
- **IE-00.02 — CONCLUÍDA no escopo documental desta revisão:** documentos vigentes separados dos snapshots históricos e verificações locais aprovadas. [Evidências e limites](governance/IE_00_02_CURRENT_STATE_HISTORY_2026-10-15.md). Vigência na main exige gates aprovados e merge confirmado na PR correspondente.
- **IE-00.03 — CONCLUÍDA no escopo da decisão desta revisão:** Kauê escolheu **Resenha diária** em 15/10/2026. Primeiro foco funcional: Noticiário/IE-05, após a base comum. [Evidência da escolha](governance/IE_00_03_REVIEW_PRIORITY_2026-10-15.md). Integração por PR com gates verdes.
- **Próxima após integração: IE-00.04 — registrar a baseline das superfícies**, destacando as lacunas que afetam a Resenha. O ciclo completo Resenha → Hoje → Anotações continua proposta de composição da candidata, não um escopo automaticamente aprovado.

O [roadmap EBSA 1.7](roadmap/INTELIGENCIA_ESPORTIVA_ROADMAP_EBSA_v1_7.md) mantém códigos e dependências. Esta revisão não fecha IE-00, o perfil ou gates de liberação.

## Dados e coleta: desenho não equivale a cobertura atual

| Fluxo | Desenho versionado/documentado | Prova atual pendente |
| --- | --- | --- |
| Catálogo | 5Dollar para fixtures/dados gerais; agenda independente de completar elencos | Competições, temporadas, conjunto esperado e cobertura |
| Elencos | API-Football; piloto documentado de seis primeiras divisões | Clubes/jogadores completos e atualizados hoje |
| Prospectivo | Dia Zero, reconciliação, lineups e dados individuais por fixture; sem backfill individual automático | Dia Zero persistido, escopo, quota e execução completa |
| Editorial | 14 veículos aprovados, números SofaScore e três eixos explicativos | Fontes recebidas, edição completa e qualidade factual |
| Transmissão | FutNaTV e fallback agregador no código; confirmação oficial no roadmap | Política do fallback e confirmação nominal |
| Elo | Rating local, liga, global e histórico separados | Contagem, finalize, auditoria, lag e corte atuais |

Etapas 3/4/4.5/5 dos registros antigos descrevem coleta; Fases 1–7 descrevem reescopo; códigos IE descrevem o roadmap atual. A ordem e as dependências vigentes são as do roadmap. Gargalo de elenco não bloqueia automaticamente Resenha/Hoje.

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
