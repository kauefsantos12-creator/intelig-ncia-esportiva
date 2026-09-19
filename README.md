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
| Repositório | kauefsantos12-creator/quant-football-insights |
| Lovable project ID | 28664075-8af4-4155-9ee9-8ed86021681a |
| Workspace Lovable | IgC7Z3MS5vlDXWjvizgE |
| Produção | https://quant-football-insights.lovable.app |
| Banco/runtime | Lovable Cloud |
| Timezone operacional | America/Sao_Paulo |

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
8. depois do merge, confirmar sincronização, publicar se necessário e validar produção.
