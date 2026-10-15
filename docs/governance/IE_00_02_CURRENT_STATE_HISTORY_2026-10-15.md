# IE-00.02 — Separar estado atual de histórico

Data: 15/10/2026, America/Sao_Paulo. Escopo: documentação do projeto, por commits.

**Estado da execução documental:** CONCLUÍDA nesta revisão, com verificações locais aprovadas. A vigência na main depende da integração da PR com todos os gates obrigatórios verdes; a PR registra esse resultado e o commit integrado. Não implica homologação de runtime.

## Referência e método

Main consultada pelo GitHub conectado: `868c13ac99c92bfdf202c6ace64f3ebe85e5b1b1`, tree `24b5f1445708d43d5d26d8ded977087d4a915592`. A árvore local de revisão foi comparada com essa referência antes das edições. A cópia de trabalho anterior foi preservada.

Leitura dirigida de AGENTS, README, ARCHITECTURE, GOVERNANCE, PROJECT_STATE, índice documental, roadmap, AppShell, rotas, funções de Noticiário/Hoje/Elo/Analytics/Anotações, middleware, worker, política editorial, migrations e workflows. Confrontados também relatórios de reescopo e recuperação de 04/10. Não é inventário funcional completo da IE-00.04.

## Correções e rastreabilidade

| Achado | Tratamento |
| --- | --- |
| Arquitetura descrevia upload CSV, odds, picks e banca | Documento vigente descreve as superfícies e camadas presentes no código; texto anterior preservado integralmente após aviso histórico |
| Governança tratava três picks e métricas financeiras como jornada atual | Regras atuais explicitadas; controles gerais mantidos; políticas legadas com escopo identificado e snapshot preservado |
| 116/116 elencos e auditorias de 20/09 pareciam atuais | Data/ambiente e limites explícitos; nenhuma nova contagem inferida |
| PROJECT_STATE ainda pedia restaurar migrations antigas | Corrigido: 135 SQLs já arquivados e duas migrations novas; aplicação no PRIMARY não comprovada |
| PRs antigos podiam ser confundidos com o repositório novo | Mantidos no histórico com aviso de origem; sem inferir links no repo atual |
| Índice encaminhava primeiro ao produto antigo | Entrada por estado, arquitetura, governança e roadmap; CASE_STUDY e auditorias datadas identificados como históricos |
| Próxima ação ainda apontava ao trabalho já iniciado | Roadmap registra IE-00.02 e mantém IE-00.03 dependente da integração |

Os snapshots em `docs/history/ie-00-02-2026-10-15/` preservam os corpos de ARCHITECTURE, GOVERNANCE e PROJECT_STATE da baseline, acrescidos apenas de aviso inicial. README original continua no histórico Git. Não há exclusão física de dados, modelos, contratos, migrations ou documentos antigos.

## Validação

- Referência local inicial: tree idêntica à main consultada.
- PASS: os três corpos históricos são idênticos aos blobs da baseline após remover apenas o aviso inicial de cada snapshot.
- PASS: links locais dos 11 documentos da revisão e referências principais de código; inventário de 135 SQLs arquivados e duas migrations novas. Links internos nos corpos históricos conservam sua base original e são tratados como registro, não como navegação atual.
- PASS: `git diff --check` e fronteiras de arquitetura (151 arquivos TypeScript).
- PASS: lint (zero erros; 4.679 avisos no código sem alteração nesta revisão) e TypeScript `--noEmit`. Não foram corrigidos avisos fora do escopo nem relaxados controles.
- CI obrigatório: o resultado remoto fica na PR desta revisão e deve ser aprovado antes da integração. Não inferir aprovação de CI a partir das verificações locais.

## Limites e rollback

Mudança exclusivamente documental. Sem alteração de código, dependência, schema, configuração de fonte, job, dado pessoal ou fórmula. Sem consulta ao banco vivo, teste de login, deploy, carga ou mensagem ao Lovable nesta ação. Não foi comprovada sincronização atual nem publicação.

Contagens de setembro e outubro permanecem registros datados. Pendências de transmissão, falha versus vazio, projeções de Analytics, temporadas, quota, acesso e restore continuam abertas nas ações próprias. A revisão não altera contratos de métricas/fontes ou políticas de retenção do runtime.

Rollback: novo commit de reversão da alteração documental; preservar história publicada e registros pessoais.

## Próximo passo

Após gates verdes e integração confirmada, conduzir IE-00.03 com Kauê: definir qual experiência pessoal deve melhorar primeiro. Resenha → escolha dos jogos → anotações permanece proposta, sem aprovação presumida. Nenhum capítulo, candidata ou gate de publicação é fechado por esta revisão.
