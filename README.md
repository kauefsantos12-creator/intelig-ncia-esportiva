# Motor de Inteligência Esportiva

> Plataforma full-stack de inteligência esportiva para futebol, com dados canônicos, Elo hierárquico, agenda, análises, noticiário e anotações pós-jogo.

O produto atual não possui fluxo de apostas, odds, banca, picks ou execução financeira.

## Produto atual

- **Noticiário** — resenha diária, fatos de partidas e movimentos relevantes de Elo.
- **Hoje** — agenda de jogos, transmissões e contexto pré-jogo.
- **Elo** — ranking de clubes e ligas, filtros geográficos e histórico point-in-time.
- **Analytics 2026/27** — recortes por time, competição, elenco e jogadores.
- **Anotações** — fila pós-jogo, assistiu/não assistiu, comentários, notas pessoais e campinho persistente.

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

## Estado operacional atual — trilha de dados esportivos

A numeração abaixo é **operacional da coleta de dados atual** e não substitui as sete fases históricas do reescopo do produto.

- **Etapa 3 — Elencos:** concluída e validada em 19/09/2026 com **116/116 clubes** das seis ligas prioritárias: Premier League (20), Ligue 1 (18), Brasileirão Série A (20), Bundesliga (18), Serie A italiana (20) e La Liga (20).
- **Etapa 4 — Dia Zero prospectivo:** coleta detalhada por fixture a partir do Dia Zero, sem backfill histórico. O detalhamento via API-Football é exclusivo dessas seis ligas e inclui vínculo da fixture, lineups e fixtures/players, com persistência de estatísticas individuais.
- **Etapa 4.5 — Agenda/Programação:** próxima validação operacional depois da primeira coleta real da Etapa 4; auditar completude da agenda, horários em America/Sao_Paulo, adiamentos/cancelamentos, duplicidades, ordenação e camada separada de transmissão.
- **Etapa 5 — Analytics:** consolidar os dados prospectivos em leitura de forma, participação, minutos, desempenho e demais superfícies analíticas.

A agenda geral continua baseada no catálogo canônico de fixtures. O detalhamento individual da Etapa 4 não define quais jogos existem na agenda; ele apenas enriquece partidas das seis ligas com elencos validados.

## Qualidade e segurança

O CI obrigatório cobre lint, typecheck, arquitetura, vulnerabilidades, secret scan, governança documental, rebuild completo das migrations, regressões sports_intelligence/RLS, unit tests, build, performance, browsers, responsividade e acessibilidade.

## Documentação canônica

- [Roadmap pessoal e operacional — EBSA 1.7](docs/roadmap/INTELIGENCIA_ESPORTIVA_ROADMAP_EBSA_v1_7.md)
- [Evidência de identidade — IE-00.01](docs/governance/IE_00_01_PROJECT_IDENTITY_2026-10-11.md)
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
