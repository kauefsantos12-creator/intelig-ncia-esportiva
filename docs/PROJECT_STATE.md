# Motor de Inteligência Esportiva — estado canônico

> Atualizado: 04/10/2026  
> Repositório: kauefsantos12-creator/intelig-ncia-esportiva  
> Produção: https://value-bet-engine.lovable.app  
> Lovable Cloud (Supabase): hefuvmocohhpmnhwpkac  
> Histórico: até 01/10/2026 o projeto vivia em kauefsantos12-creator/quant-football-insights (Lovable 28664075-…, Supabase vsygkpwptoppbrlnrpcp, produção quant-football-insights.lovable.app).

Este documento registra o estado vigente do produto. Auditorias e migrations antigas preservam a trilha histórica, mas não representam o runtime atual quando contradizem o main ou o estado vivo do Lovable Cloud.

## Remix de 01/10/2026 e recuperação

Em 01/10/2026 o projeto foi remixado para outra conta Lovable (commit `f600756`, "Add integration configuration from remix"). O remix:

- apontou o app para um novo Lovable Cloud (`hefuvmocohhpmnhwpkac`), que recebeu o esquema mas nenhum dado;
- apagou `supabase/migrations/` do repositório (o estado completo continua em `f600756~1`);
- regenerou `src/integrations/supabase/auth-middleware.ts`, removendo `is_approved_app_user` e o prazo absoluto de 30 dias no servidor;
- não copiou gatilhos de `auth.users`, segredos do Vault nem jobs do `pg_cron`.

Recuperação de 04/10/2026:

- `scripts/diagnostico-remix.sql`: diagnóstico somente leitura do banco;
- `scripts/recuperacao-remix.sql`: segredos do Vault, gatilhos de auth, dados de configuração das migrations originais e os 20 jobs `pg_cron` finais — aplicado e validado no Lovable Cloud em 04/10/2026;
- `scripts/carga-inicial.sql` / `scripts/status-carga.sql`: carga inicial (5Dollar ontem/hoje/amanhã + Elo temporário a cada 2 min) e acompanhamento;
- `auth-middleware.ts` restaurado a partir de `f600756~1` (allowlist via `is_approved_app_user` + sessão de 30 dias).

O Dia Zero da coleta prospectiva (Etapa 4) foi reiniciado em 04/10/2026 no banco novo. Pendente: restaurar `supabase/migrations/` no repositório sem reaplicá-las ao banco novo.

## Fontes de verdade

- **GitHub main**: código, testes, migrations, contratos e documentação versionados.
- **Lovable Cloud**: banco/runtime e estado operacional vivos.
- **Lovable**: aplicação canônica ligada a este repositório.

Regra obrigatória: implementado ≠ testado ≠ mergeado ≠ sincronizado ≠ publicado ≠ validado em produção.

## Produto vigente

O sistema é um **Motor de Inteligência Esportiva**, sem fluxo ativo de apostas, odds, banca, picks, stake ou execução financeira.

Superfícies atuais:

1. **Noticiário** — resenha diária, fact packs e movimentos relevantes de Elo.
2. **Hoje** — agenda, transmissão e contexto pré-jogo.
3. **Elo** — clubes, ligas, filtros e histórico point-in-time.
4. **Anotações** — fila pós-jogo, watched/not watched, comentários, notas pessoais e campinho.
5. **Analytics 2026/27** — times, competições, elenco, jogadores e recortes por torneio.
6. **Conta/Privacidade** — autenticação single-user e controles de privacidade.

## Duas numerações que não devem ser confundidas

Existem dois conjuntos de etapas documentados no repositório:

- **Fases 1–7 do reescopo de produto (15–16/09):** fundação, Elo, Hoje, Anotações, Analytics, Noticiário e corte do runtime antigo. Essas sete fases estão concluídas e representam a transformação do produto.
- **Etapas operacionais atuais de dados (19/09 em diante):** sequência de consolidação de elencos, coleta prospectiva por partida, agenda e analytics vivos.

Portanto, quando este documento disser **Etapa 3** abaixo, significa **elencos**, não a antiga Fase 3 = Hoje.

## Estado operacional atual de dados

### Etapa 3 — Elencos

**Concluída e validada: 116/116 clubes com elenco fresco.**

| Liga | Clubes |
| --- | ---: |
| Premier League | 20 |
| Ligue 1 | 18 |
| Brasileirão Série A | 20 |
| Bundesliga | 18 |
| Serie A italiana | 20 |
| La Liga | 20 |
| **Total** | **116** |

A API-Football é a camada de jogador/elenco. Não há necessidade de detalhamento individual para competições sem elenco carregado nesta etapa.

### Etapa 4 — Dia Zero prospectivo

Objetivo: construir histórico próprio daqui para frente, sem backfill histórico.

Regras canônicas:

- apenas fixtures com kickoff posterior ao Dia Zero persistido;
- coleta detalhada via API-Football somente nas seis ligas da Etapa 3;
- pipeline por fixture: reconciliação → lineups → fixtures/players → persistência em sports_fixture_player_stats;
- estatísticas gerais de equipe continuam no fluxo canônico da 5Dollar;
- endpoint player-season é utilitário legado, não caminho primário do worker;
- copas, continentais, segundas divisões e demais torneios podem permanecer na agenda/base geral, mas não consomem o detalhamento individual desta Etapa 4.

A migration de restrição de escopo está no PR #26 enquanto este documento é atualizado; só pode ser considerada ativa após gates verdes, merge, sincronização e validação no Lovable Cloud.

### Etapa 4.5 — Agenda/Programação

Depois que a primeira partida real da Etapa 4 atravessar o pipeline completo, auditar:

- completude dos jogos do escopo acompanhado;
- horário e data em America/Sao_Paulo;
- adiamentos, cancelamentos e mudança de horário;
- duplicidades;
- mandante/visitante, competição e ordenação cronológica;
- transição entre agendado/ao vivo/encerrado;
- camada de transmissão separada da fonte de agenda.

A agenda oficial vem de sports_fixtures/catálogo canônico. Evidência de transmissão fica em sports_broadcast_evidence. FutNaTV é fonte editorial de transmissão, não fonte de verdade para existência ou horário da partida.

### Etapa 5 — Analytics

Somente depois da validação da coleta prospectiva e da agenda: consolidar participação, minutos, titularidades, notas, forma recente, comparações e demais indicadores para as superfícies analíticas.

## Backend e dados

O Lovable Cloud contém competições, equipes, fixtures, eventos, estatísticas, jogadores, elencos, lineups, transmissões, fact packs, analytics, reviews pessoais, jobs e Elo. Integrações esportivas permanecem normalizadas e server-side. Jobs usam idempotência, leases/retries e proteção contra processamento duplicado.

### Auditoria incremental do Noticiário — 20/09/2026

- **Resultados recentes:** o recorte prioritário passou a ocorrer no banco antes do limite, e clubes reconciliados com API-Football fornecem escudos com fallback visual no frontend.
- **Movimentos de Elo:** a correção em auditoria passa a consultar somente o Elo local canônico `elo-v1-w020`, aplicar `|delta| >= 2` e ordenar por impacto antes do limite de 8 movimentos. A superfície deixa explícito que este card é Elo local, enquanto `/elo` permanece a referência para Elo global/hierárquico.
- Implementação, testes e documentação versionados não equivalem a produção: considerar o segundo item concluído somente após gates verdes, merge e validação do runtime.


### Auditoria incremental da aba Elo — 20/09/2026

- **Saúde do backend:** auditoria hierárquica diária `OK`; 32/32 ligas domésticas sincronizadas; 9/9 competições cross-league sincronizadas; 0 violações de hierarquia e 0 problemas de integridade no ledger.
- **Ranking atual por clube — concluído em produção:** o snapshot inicial encontrou 737 linhas para 681 clubes únicos e 56 clubes duplicados por preservarem o rating local da divisão anterior após promoção/rebaixamento.
- **Read-model atual:** `elo_global_team_ratings` agora expõe exatamente uma linha por `team_id`, escolhendo o contexto com `last_fixture_at` mais recente e preservando todas as 737 linhas históricas em `elo_team_ratings`.
- **Validação runtime pós-merge:** 681 linhas atuais / 681 clubes distintos / 0 duplicidades / 0 divergências da fórmula; a aba Hoje permaneceu com 54/54 equipes com Elo atual.
- **Fórmula preservada:** `global_rating = league_rating + (local_rating - 1500)`.
- **Item 1 do plano Elo:** concluído e validado.
- **Item 2 — referência temporal:** auditoria runtime confirmou fechamento diário às 05:05 de Brasília, 32/32 ligas domésticas + 9/9 cross-league concluídas e lag de 0 minuto entre a última fixture elegível antes do fechamento e a última fixture Elo processada.
- **Item 2 — concluído e validado:** `getEloDirectory()` lê `elo_sync_state`; a UI mostra horário real do snapshot, última partida considerada e cobertura da rodada. Pós-merge, Lovable sincronizado no commit `7411b8d...`, runtime permaneceu `OK`, 32/32 domésticas + 9/9 cross-league e lag 0 minuto. A chamada manual de deploy foi disparada, mas a API ainda reportava `pending`.
- **Item 3 — concluído e validado:** PR #62 mergeado no commit `d6444f9...`; Lovable sincronizado nesse commit, `ready` e publicado. O ranking vivo permanece em 681/681 clubes, 32 ligas, 22 países, 4 regiões e 2 divisões. A tabela deixou de usar `slice(0, 100)`, pagina 50 resultados, oferece filtros por liga/divisão e ordenações controladas, preservando a posição global original. A chamada manual de deploy `b1f187c1-a2a3-47dc-9105-9dedf70a83b0` ainda retornava `pending`.
- **Item 4 — UX do ranking em implementação:** a auditoria visual encontrou ranking correto, porém pouco identificável por clube. Dos 681 clubes Elo, 164 já possuem `logo_url` canônico em `sports_teams` e 517 não possuem. A correção usa escudo quando disponível e fallback por iniciais, reforça posição global, contexto do clube selecionado e legibilidade mobile sem alterar cálculo Elo.

### Auditoria incremental da aba Hoje — 20/09/2026

- **Transmissões:** concluídas em produção. O FutNaTV permanece como guia primário e `futebol.tv.br` atua como fallback agregador com proveniência explícita. O teste real pós-merge gravou 123 evidências em 74 fixtures; 26/27 jogos prioritários do snapshot tinham transmissão, e Norwich x Bolton permaneceu corretamente como “ainda não confirmada”.
- **Agenda viva:** concluída em produção. `get_today_tracked_fixtures(...)` aplica `always_track` no banco antes da ordenação/limite e retornou os 27 jogos prioritários do snapshot.
- **Consulta da forma recente:** concluída em produção. `get_recent_team_fixtures(...)` recebe apenas as equipes presentes na agenda e não apresentou divergências entre histórico disponível e histórico retornado.
- **Completude histórica da forma:** o snapshot inicial mostrou 54 equipes, 19 com algum jogo anterior persistido e nenhuma com 5 jogos completos. Depois do seed por liga, 54/54 passaram a ter histórico e 30/54 chegaram a 5 jogos. O complemento cross-competition levou 48/54 a 5 jogos dentro de 90 dias; para Bayer Leverkusen, Fulham, Leeds, Paderborn, RB Leipzig e TSG Hoffenheim o quinto jogo disponível era de maio. A consulta/deficiência passa a usar guarda de 365 dias para entregar os últimos 5 jogos de verdade.
- **Seed em auditoria:** `enqueue_today_recent_form_backfill(...)` cria um job `FIVE_DOLLAR_RECENT_FORM_LEAGUE` por liga deficiente. Cada job usa a liga como primeira camada e, apenas para times ainda abaixo de 5 jogos, complementa via histórico do próprio time em outras competições. O seed continua persistindo somente fixture/placar/equipes/competição, sem backfill de lineups, jogadores ou estatísticas individuais, preservando a regra de Dia Zero da Etapa 4.
- **Escudos:** concluídos em produção. Bolton, Norwich, West Brom e Wolverhampton foram reconciliados via `API_FOOTBALL_TEAM_MEDIA_LINK`; a agenda ficou com 54/54 equipes com `logo_url`, sem ampliar a coleta detalhada da Championship.
- **Forma recente:** concluída em produção com 54/54 equipes contendo ao menos 5 jogos candidatos na guarda de 365 dias; o frontend exibe os últimos 5 anteriores ao kickoff.
- **Status/placar intradiário:** o E2E final encontrou o catálogo congelado no snapshot das 04:35. Um refresh manual corrigiu imediatamente jogos encerrados/ao vivo; a correção em versionamento adiciona refresh canônico a cada 15 minutos entre 06:00 e 23:45 de São Paulo.

## Limitações e pendências conhecidas

- Em 19/09, o teste real Tottenham x Aston Villa revelou uma falha de identidade de competição: algumas fixtures das seis ligas estão ligadas ao registro canônico 5Dollar, enquanto os IDs API-Football podem estar em um registro irmão da mesma liga. A função de escopo deve reconhecer ambas as identidades de provedor. A correção está sendo versionada em migration própria e deve reabrir apenas jobs prospectivos que foram mortos por esse bug.
- A correção de **titularidades (starts)** foi versionada na branch `fix/stage4-rate-limit-starts`: a view passa a derivar titularidade de `sports_fixture_lineups.is_starting`, em vez de inferi-la do JSON de stats. Só considerar resolvido após gates, merge e validação no Lovable Cloud.
- O teste Osasuna x Rayo confirmou rate limit **por minuto** da API-Football (`Too many requests... per minute`), não cota diária. A correção reduz o teto distribuído, espaça chamadas, prioriza `API_FOOTBALL_FIXTURE_DATA` e amplia a tolerância de retry dos jobs pós-jogo.
- A Etapa 4 só deve ser encerrada após pelo menos uma partida real completar automaticamente o fluxo de coleta detalhada.
- Depois disso, executar a auditoria da Agenda/Programação (Etapa 4.5).

## Protocolo para continuidade

1. consultar main, README e este documento;
2. consultar o commit atual no Lovable;
3. consultar o Lovable Cloud para banco/jobs/dados;
4. antes de qualquer status da Etapa 3, fazer consulta fresca dos 116 elencos;
5. não assumir sincronização ou execução de automações;
6. para código: branch → alteração → PR → gates verdes → merge;
7. depois do merge: confirmar sincronização, publicar se necessário e validar produção;
8. manter migrations/auditorias antigas como trilha histórica, sem tratá-las como arquitetura ativa.
