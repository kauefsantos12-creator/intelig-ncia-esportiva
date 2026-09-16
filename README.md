# Motor de Inteligência Esportiva

> Plataforma full-stack de inteligência esportiva para futebol, com dados canônicos, Elo hierárquico, agenda, análises, noticiário e anotações pós-jogo.

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111)
![TanStack Start](https://img.shields.io/badge/TanStack-Start-FF4154?logo=reactquery&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Lovable_Cloud-PostgreSQL-3FCF8E)
![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=githubactions&logoColor=white)

O **Motor de Inteligência Esportiva** consolida dados de futebol em uma aplicação autenticada voltada a acompanhamento, exploração e leitura esportiva. O produto atual não possui fluxo de apostas, odds, banca, picks ou execução financeira.

## Produto atual

- **Noticiário** — resenha diária, fatos de partidas e movimentos relevantes de Elo.
- **Hoje** — agenda de jogos, transmissões e sinais pré-jogo baseados em dados canônicos.
- **Elo** — ranking de clubes e ligas, filtros geográficos e histórico point-in-time.
- **Analytics 2026/27** — recortes por time, competição, elenco e jogadores.
- **Anotações** — fila pós-jogo, assistiu/não assistiu, comentários, notas pessoais de jogadores e campinho persistente.

## Stack

- React 19 + TanStack Start
- TypeScript
- Lovable / Lovable Cloud
- PostgreSQL com migrations versionadas e RLS
- integração com provedores esportivos
- Vitest + pgTAP/Supabase CLI + Playwright
- GitHub Actions

## Identidade canônica

| Item | Valor |
| --- | --- |
| Repositório | `kauefsantos12-creator/quant-football-insights` |
| Lovable project ID | `28664075-8af4-4155-9ee9-8ed86021681a` |
| Workspace Lovable | `IgC7Z3MS5vlDXWjvizgE` |
| Produção | `https://quant-football-insights.lovable.app` |
| Banco/runtime | **Lovable Cloud** |
| Timezone operacional | `America/Sao_Paulo` |

Não criar um projeto Lovable paralelo para continuar este produto.

## Fontes de verdade

- **GitHub `main`** — código, testes, migrations, contratos e documentação versionados.
- **Lovable Cloud** — banco e estado operacional vivos.
- **Lovable** — aplicação ligada ao repositório canônico.

Nunca tratar estes estados como equivalentes:

```text
implementado ≠ testado ≠ mergeado ≠ sincronizado ≠ publicado ≠ validado em produção
```

## Arquitetura resumida

```text
Provedores esportivos
        ↓
normalização / jobs idempotentes
        ↓
Lovable Cloud
  ├─ catálogo esportivo
  ├─ fixtures / eventos / estatísticas
  ├─ jogadores / lineups / transmissões
  ├─ Elo hierárquico
  ├─ analytics de temporada
  ├─ briefings / fact packs
  └─ anotações pessoais owner-scoped
        ↓
TanStack Start server functions
        ↓
React UI autenticada
```

Acesso privilegiado ao banco permanece server-side. Dados pessoais de Anotações são isolados por `owner_id` e RLS e não alteram estatísticas oficiais.

## Qualidade e segurança

O CI obrigatório cobre, entre outros:

- lint, typecheck e boundaries de arquitetura;
- auditoria de dependências e secret scan;
- server secret boundary;
- governança documental e árvore de rotas;
- rebuild completo das migrations;
- regressões `sports_intelligence` e RLS;
- unit tests e contratos de superfície;
- build e orçamento de bundle;
- smoke de carga;
- Chromium, Firefox e WebKit;
- responsividade e acessibilidade automatizada.

## Reescopo do produto

O projeto nasceu a partir de um motor quantitativo ligado a apostas. Em 16/09/2026, esse runtime foi descomissionado de forma governada: jobs, tabelas e RPCs exclusivos do produto antigo foram removidos do ambiente ativo, enquanto migrations e documentos históricos foram preservados como trilha de auditoria.

O código executável atual possui contratos que impedem a reintrodução dessas superfícies no frontend e no runtime.

## Estado atual

As sete fases do reescopo para Inteligência Esportiva estão implementadas no `main`. O estado operacional detalhado e as validações vivas ficam em [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md).

Documentação adicional:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/GOVERNANCE.md`](docs/GOVERNANCE.md)
- [`docs/governance/SPORTS_INTELLIGENCE_RESCOPE_2026-09-15.md`](docs/governance/SPORTS_INTELLIGENCE_RESCOPE_2026-09-15.md)
- [`docs/governance/SPORTS_INTELLIGENCE_IMPLEMENTATION_PHASES_2026-09-15.md`](docs/governance/SPORTS_INTELLIGENCE_IMPLEMENTATION_PHASES_2026-09-15.md)

## Protocolo para próximos trabalhos

1. consultar o `main` atual;
2. ler este README e `docs/PROJECT_STATE.md`;
3. consultar o projeto Lovable canônico e seu commit atual;
4. consultar o Lovable Cloud quando a tarefa envolver banco, dados, jobs ou migrations;
5. para alteração de código: **branch → alteração → PR → gates verdes → merge**;
6. nunca fazer merge com gate pendente ou falhando;
7. depois do merge, confirmar sincronização, publicar se necessário e validar produção.
