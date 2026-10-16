# Motor de Inteligência Esportiva

> Caderno pessoal de futebol: partidas acompanhadas, escalações disponíveis e seus relatos.

O produto atual não possui fluxo de apostas, odds, banca, picks ou execução financeira.

## Produto atual

**Meus Jogos é o único foco ativo**, por decisão de Kauê em 16/10/2026: escolher a partida, consultar titulares/reservas disponíveis e guardar seu relato antes, durante ou depois do jogo. A entrada `/` reúne escalação e relatos pessoais; o formulário manual continua disponível quando a leitura esportiva falha. Conta/Privacidade e o histórico anterior são preservados.

A evolução de Resenha/Noticiário, Hoje separado, Elo e Analytics fica pausada. A pausa não desativa jobs ou a automação externa do ChatGPT. [Decisão, implementação e aceite](docs/governance/MEUS_JOGOS_SCOPE_2026-10-16.md).

## Identidade canônica

| Item | Valor |
| --- | --- |
| Repositório | kauefsantos12-creator/intelig-ncia-esportiva |
| Branch canônica | main |
| Lovable project ID | 428fa571-e363-4bbf-ab2c-058451eba7dc |
| Workspace Lovable | a6f6ab0ce77b5538cbf7 |
| Editor conectado | https://lovable.dev/projects/428fa571-e363-4bbf-ab2c-058451eba7dc |
| Endereço público nesta fase | Não se aplica — desenvolvimento por commits, confirmado por Kauê em 11/10/2026 |
| Banco/runtime PRIMARY | Lovable Cloud — hefuvmocohhpmnhwpkac |
| Timezone operacional | America/Sao_Paulo |

Identidade conferida em 11/10/2026 na tarefa IE-00.01. GitHub main e projeto Lovable conectado apontavam para `4696c8eb400a088b226dce0653eb775b64383490`; a conexão SQL do projeto respondeu em modo somente leitura. Kauê confirmou que não há endereço de publicação nesta fase e que o trabalho deve seguir por commits neste repositório. A ausência de URL não bloqueia a preparação do projeto; publicação e validação da aplicação serão verificadas na etapa correspondente do roadmap. Evidências e limites: [IE-00.01 — identidade atual](docs/governance/IE_00_01_PROJECT_IDENTITY_2026-10-11.md).

`quant-football-insights`, Lovable `28664075-…` e banco `vsygkpwptoppbrlnrpcp` pertencem ao histórico anterior ao remix de 01/10/2026.

Não criar um projeto Lovable paralelo para continuar este produto.

## Fontes de verdade

- **GitHub main** — código, testes, migrations, contratos e documentação versionados.
- **Lovable Cloud** — banco e estado operacional vivos.
- **Lovable** — aplicação ligada ao repositório canônico.

Nunca tratar estes estados como equivalentes:

implementado ≠ testado ≠ mergeado ≠ sincronizado ≠ publicado ≠ validado em produção

## Reescopo do produto

O projeto nasceu a partir de um motor quantitativo ligado a apostas. Em 16/09/2026, esse runtime foi descomissionado de forma governada. Migrations e documentos históricos foram preservados como trilha de auditoria.

## Estado documental e dados — revisão de 15/10/2026

A IE-00.02 separa a arquitetura e a governança atuais dos [registros históricos](docs/history/README.md). Presença no código, evidência datada e funcionamento no ambiente vivo têm significados distintos.

- **Elencos:** 116/116 clubes é uma validação de 19/09 no banco anterior ao remix. Não comprova cobertura no PRIMARY atual. O registro pós-remix de 04/10 encontrou 15 clubes com linhas de elenco; também não é uma contagem de hoje nem prova de elencos completos.
- **Coleta prospectiva:** o desenho usa Dia Zero e detalhamento por fixture via API-Football no escopo individual. Dia Zero persistido, quota, completude e execução automática exigem nova evidência.
- **Agenda/Resenha:** possuem escopo próprio; não precisam aguardar todos os elencos. Falha versus vazio e confirmação oficial de transmissão permanecem no roadmap.
- **Analytics:** reconciliação de player-season com dados por fixture e temporada por competição permanece pendente; a etiqueta 2026/27 não comprova correspondência de todas as ligas.
- **Migrations:** os 135 SQLs históricos já estão em `supabase/migrations_archive/`; as duas migrations editoriais novas ficam em `supabase/migrations/`. Reconstrução isolada no CI não autoriza replay no Cloud.

Fases históricas do reescopo, etapas antigas de coleta e códigos IE do roadmap são numerações distintas. Situação, origem e limites de cada evidência: [PROJECT_STATE.md](docs/PROJECT_STATE.md). A decisão de Resenha primeiro de 15/10 foi substituída por **Meus Jogos apenas** em 16/10. O PROJECT_PROFILE/IE-00.05 permanece pendente; a próxima entrega funcional é validar a partida, sua escalação e o salvamento/reabertura do relato na aplicação real. A base comum e os controles de qualidade seguem aplicáveis.

## Qualidade e segurança

O CI obrigatório cobre lint, typecheck, arquitetura, vulnerabilidades, secret scan, governança documental, rebuild completo das migrations, regressões sports_intelligence/RLS, unit tests, build, performance, browsers, responsividade e acessibilidade.

## Documentação canônica

- [Roadmap pessoal e operacional — EBSA 1.7](docs/roadmap/INTELIGENCIA_ESPORTIVA_ROADMAP_EBSA_v1_7.md)
- [Evidência de identidade — IE-00.01](docs/governance/IE_00_01_PROJECT_IDENTITY_2026-10-11.md)
- [Separação entre estado e histórico — IE-00.02](docs/governance/IE_00_02_CURRENT_STATE_HISTORY_2026-10-15.md)
- [Prioridade anterior preservada — IE-00.03: Resenha diária](docs/governance/IE_00_03_REVIEW_PRIORITY_2026-10-15.md)
- [Baseline atual das superfícies — IE-00.04](docs/governance/IE_00_04_SURFACE_BASELINE_2026-10-15.md)
- [Índice da documentação](docs/README.md)
- [Histórico preservado](docs/history/README.md)
- docs/PROJECT_STATE.md
- docs/ARCHITECTURE.md
- docs/GOVERNANCE.md
- docs/governance/SPORTS_INTELLIGENCE_RESCOPE_2026-09-15.md
- docs/governance/SPORTS_INTELLIGENCE_IMPLEMENTATION_PHASES_2026-09-15.md
- docs/governance/STAGE4_PROSPECTIVE_FIXTURE_COLLECTION_2026-09-19.md
- docs/governance/TODAY_SURFACE_2026-09-16.md

## Protocolo para próximos trabalhos

1. consultar o main atual;
2. ler este README e docs/PROJECT_STATE.md;
3. consultar o projeto Lovable canônico e seu commit atual;
4. consultar o Lovable Cloud quando a tarefa envolver banco, dados, jobs ou migrations;
5. distinguir as sete fases históricas do reescopo das etapas operacionais atuais de dados;
6. para alteração de código: branch → alteração → PR → gates verdes → merge;
7. nunca fazer merge com gate pendente ou falhando;
8. depois do merge, registrar o commit integrado; confirmar sincronização e validar publicação quando essas operações pertencerem à entrega do roadmap.
