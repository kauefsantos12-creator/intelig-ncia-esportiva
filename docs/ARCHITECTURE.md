# Arquitetura — Motor de Inteligência Esportiva

> Revisão documental: 15/10/2026, IE-00.02. Referência: main `868c13ac99c92bfdf202c6ace64f3ebe85e5b1b1`.
> A estrutura observada no código não certifica dados, acesso, jobs ou disponibilidade do ambiente vivo.

## Produto e fontes de verdade

O produto reúne Noticiário, Hoje, Elo, Analytics e Anotações, com Conta/Privacidade. A navegação está em `src/components/AppShell.tsx`. A jornada de CSV, odds, picks e banca pertence ao produto anterior, descomissionado em setembro. Código, tipos e tabelas legados não autorizam sua reativação.

GitHub main de `kauefsantos12-creator/intelig-ncia-esportiva` governa código, contratos, testes e documentação. Lovable Cloud é a autoridade sobre dados e operação vivos. O PRIMARY configurado é `hefuvmocohhpmnhwpkac`; o projeto conectado registrado na IE-00.01 é `428fa571-e363-4bbf-ab2c-058451eba7dc`. A fase definida por Kauê é desenvolvimento por commits, sem endereço público nesta preparação. Configuração, sincronização e disponibilidade são evidências distintas.

Ver [estado canônico](PROJECT_STATE.md), [governança](GOVERNANCE.md) e [arquitetura anterior preservada](history/ie-00-02-2026-10-15/ARCHITECTURE.md).

## Camadas observadas no código

| Camada | Responsabilidade | Referências |
| --- | --- | --- |
| Interface React/TanStack | Navegação e leitura esportiva, filtros e registros pessoais | `src/routes/`, `src/components/AppShell.tsx` |
| Server Functions | Projeções e operações autenticadas de cada superfície | `news-overview.functions.ts`, `today-overview.functions.ts`, `elo-explorer.functions.ts`, `analytics-overview.functions.ts`, `notes-overview.functions.ts`, em `src/lib/` |
| Ingestão e worker | Reconciliação, cache, quota, leases, heartbeat e retry | `src/lib/sports/`, `src/lib/adapters/` |
| Editorial | Evidência factual, fontes aprovadas, números SofaScore e refinamento | `editorial-policy.ts`, `editorial-source-sync.server.ts`, `sofascore-editorial-sync.server.ts`, `editorial-ai-refinement.server.ts`, em `src/lib/sports/` |
| Elo e lógica pura | Ratings de clube/liga e histórico, separados da persistência | `src/lib/engine/`, `src/lib/elo-sync.server.ts` |
| Persistência e acesso | Catálogo, projeções, RPCs, permissões, notas e estado dos jobs | Lovable Cloud/PostgreSQL; `src/integrations/supabase/`, `src/lib/admin-db.ts`, `src/lib/sports/sports-db.server.ts` |

## Fluxos atuais e limites conhecidos

- **Hoje:** catálogo canônico de fixtures, forma, Elo e evidências de transmissão. Existência e horário da partida não vêm do guia de TV. Na Home, falha da programação pode virar vazio; evidência de agregador ainda não comprova a confirmação oficial exigida. Achados permanecem em IE-04.03–06.
- **Noticiário:** edições e itens editoriais seguem `editorial-explanatory-v3` e os três eixos aprovados: resenha explicativa, contraste entre placar e desempenho e protagonista dentro do jogo. Elo é uma superfície separada e não entra na redação.
- **Elo:** distingue rating local, rating de liga, fotografia global atual e histórico por partida. O cliente não redefine a fórmula; cobertura, freshness e histórico exigem a trilha IE-06.
- **Anotações:** reviews vinculados ao usuário, assistiu/não assistiu, comentários, notas pessoais e campinho persistido. Nota pessoal, nota do provedor e estatística observada têm significados distintos.
- **Analytics:** o detalhe atual consulta `sports_player_season_stats`, enquanto a coleta prospectiva documenta estatísticas por fixture. Reconciliação das projeções permanece aberta em IE-LP2/IE-08.
- **Automação:** coletores alimentam dados normalizados e jobs persistidos. O worker contém o recorte `2026/27`; sua correspondência com cada competição, inclusive o Brasil, precisa de validação. Rota ou função presente não comprova cron ativo.

## Papel das fontes

| Finalidade | Referência atual |
| --- | --- |
| Catálogo, resultados e dados gerais | 5Dollar, com normalização e proveniência |
| Elencos, escalações e dados individuais | API-Football, no escopo e quota validados |
| Números de desempenho da resenha | Exclusivamente SofaScore; ausência implica omissão |
| Contexto jornalístico | Os 14 veículos de `editorial-policy.ts`; RSS parcial não equivale à matéria completa |
| Descoberta de transmissão | FutNaTV; fallback `futebol.tv.br` existe no código e tem política pendente |
| Confirmação de transmissão no Brasil | Mapa de direitos e grade/site oficial identificando o confronto, conforme o roadmap |

Agenda/resenha e coleta individual têm escopos independentes. Esta revisão não amplia fontes, scraping, APIs ou chamadas reais, nem modifica a implementação da confirmação de transmissão.

## Segurança e dados

As funções de produto usam middleware e acesso ao banco no servidor. O cliente público do browser atende à autenticação; credenciais privilegiadas permanecem server-only. O middleware versionado verifica token, provedor Google em `app_metadata`, sessão, prazo absoluto e `is_approved_app_user`.

Essas fronteiras no código não comprovam autorização por recurso no Cloud atual. RLS, grants, views, ownership e RPCs exigem ensaio próprio em IE-01.02/03, especialmente nos caminhos administrativos. Tipos gerados também não comprovam o schema vivo.

Na baseline há **135 SQLs históricos em `supabase/migrations_archive/`** e **duas migrations editoriais novas em `supabase/migrations/`**. O CI copia o arquivo histórico para reconstrução isolada e regressões. Não reaplicá-lo automaticamente ao Cloud nem editar `supabase_migrations.schema_migrations`. Executor remoto, correspondência de schema e backup/restore permanecem para IE-01.

## Qualidade e liberação

Os workflows versionados cobrem estática/tipagem/arquitetura, dependências, segredos, documentação, reconstrução de banco e regressões, testes, build, orçamento de bundle, smoke HTTP e navegadores/acessibilidade.

`implementado ≠ testado ≠ mergeado ≠ sincronizado ≠ publicado ≠ validado em produção`.

CI aprovado em revisão documental não homologa runtime. Critérios por entrega estão no [roadmap](roadmap/INTELIGENCIA_ESPORTIVA_ROADMAP_EBSA_v1_7.md); evidências desta revisão em [IE-00.02](governance/IE_00_02_CURRENT_STATE_HISTORY_2026-10-15.md).
