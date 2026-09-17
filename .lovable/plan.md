# Auditoria funcional e técnica — Motor de Inteligência Esportiva

Auditoria de leitura em 17/09/2026, com evidência de código e do banco em produção. Nada foi alterado.

## Resumo em uma linha

O app está estruturalmente correto, mas três funcionalidades prometidas não têm quem alimente os dados (transmissões, classificação, estatísticas de temporada), a fila de anotações fecha na hora errada, a coleta da API-Football está travada por limite de plano e a bateria de testes valida texto de arquivo em vez de comportamento — por isso tudo passa verde com telas vazias.

---

## Achados por gravidade

### P0 — Quebra funcional visível

**1. Erros de tipo bloqueando build (regressão da limpeza do produto antigo)**
`src/integrations/supabase/database.types.ts:10-14,64-74,78-111` e `src/lib/admin-db.ts:5-77` ainda declaram tabelas removidas do banco (`analysis_runs`, `raw_observations`, `experimental_bet_tracking`, `experimental_bankroll_config`, `decision_opportunity_queue`, `matches`). O snapshot gerado `types.ts` já não as contém. Causa-raiz: a migration de descomissionamento foi aplicada, mas o fachada de tipos não foi limpa junto.

**2. /analytics vazio — sem produtor de dados**
`sports_standings` = 0 linhas e `sports_player_season_stats` = 0 linhas. Não existe nenhum INSERT/UPSERT em `sports_standings` em todo o repositório. Para estatísticas de temporada existe a função `syncApiFootballPlayerSeason` (`src/lib/sports/api-football-sports-sync.server.ts:310-353`), mas ela **nunca é chamada** por nenhum job, rota ou cron — é código morto. `src/lib/analytics-overview.functions.ts:197,271` lê as duas tabelas. Elencos (`sports_team_squads`, 197 linhas) funcionam.

**3. /hoje — "onde assistir" nunca terá dado**
`sports_broadcast_evidence` = 0 linhas e não há nenhum caminho de escrita no código nem nas migrations. A capability `broadcast.schedule_sources` está registrada (`20260916014500...sql:159`) com prioridade de fontes, mas o ingestor não existe. Leitura em `src/lib/today-overview.functions.ts:407`. Efeito colateral: `sports_fixture_is_review_eligible` depende de `always_track` OU evidência de transmissão, então a elegibilidade cai toda sobre as regras de tracking.

**4. /anotacoes — regra de 00:00 não funciona por usar carimbo errado**
`auto_close_sports_reviews` filtra `f.finished_at <= p_cutoff`, com cutoff = meia-noite local. Mas `finished_at` é preenchido por trigger no momento em que a ingestão observa o jogo encerrado, não no fim real da partida. Dados atuais: jogos com `kickoff_at = 2026-09-16 16:45Z` têm `finished_at = 2026-09-17 08:20Z`. Resultado: 15 reviews de ontem continuam `PENDING` e `auto_closed = false` hoje às 08:30 local; só fechariam depois da próxima virada de dia. O cron `sports-intelligence-maintenance` (*/15) roda e retorna `succeeded` — o defeito é na regra, não no agendamento.

**5. Coleta da API-Football parada**
81 jobs `DEAD`: 58 por `scope_excluded` (jogo fora do escopo permitido, mas o job é criado mesmo assim e morre — ruído estrutural), 22 por rate limit / HTTP 429. `sports_sync_state` mostra `fixture_link` e `fixture_data` com último erro de limite por minuto; `api_maintenance` com `DEGRADED` e `last_success_at` nulo. Produtor em `five-dollar-sports-sync.server.ts:250-257` enfileira `API_FOOTBALL_LINK` para **toda** fixture, sem pré-filtrar escopo.

### P1 — Confiabilidade e percepção

**6. Nenhuma falha de coleta aparece na interface**
`sports_sync_state` e `automation_runs` só são escritos; nenhuma rota ou componente os lê. O usuário vê "sem dados" sem distinguir "não houve jogo" de "a coleta falhou".

**7. Defasagem da agenda**
`sports-daily-sync-yesterday` 08:20 UTC e `-today` 08:40 UTC = 05:20/05:40 em São Paulo. Resultados da noite anterior e a agenda do dia só existem depois disso; o noticiário e a fila de anotações herdam essa defasagem. Briefings: `sports_daily_briefings` = 0 linhas — a resenha diária nunca foi gerada.

**8. /elo — chaves duplicadas e rank inconsistente**
`src/routes/elo.tsx:251` usa `key={team_model_version:team_id}`; `team_id` pode ser nulo, colidindo entre linhas. `elo.tsx:248` cai para índice da lista filtrada quando o time não é mapeável, exibindo rank global falso. Os chips de região/país vêm de `directory.leagues` (`elo.tsx:67-80`), não dos times, então time sem liga casada só aparece em "Todos". Dado real: 56 times com rating em mais de uma liga — precisa de regra explícita de desempate por liga atual.

### P2 — Testes e cobertura

**9. CI verde com funcionalidade quebrada**
Os cinco "surface contracts" (`src/today-surface-contract.test.ts`, `elo-`, `analytics-`, `notes-`, `news-`) só fazem `readFileSync` + `toContain` em strings do próprio código-fonte; nenhum importa ou executa a função que afirmam validar. Nenhum teste exercita o worker, os adapters de rede ou os read-models. Os testes Playwright só visitam `/` e `/privacidade` sem login, passando com banco vazio. E `supabase test db supabase/tests/sports_intelligence` executa apenas 7 arquivos; os ~30 `.test.sql` na raiz de `supabase/tests/` nunca rodam em CI.

### P3 — Cosmético

**10. PWA/ícones OK.** Manifest e ícones conferem em dimensão (192/512/180/32). Falta apenas ícone `maskable` para Android. `head()` por rota é único em todas as cinco telas; nenhum loader protegido em rota pública (sem risco de 401 em prerender).

---

## Plano de correção, em ordem de dependência

**Etapa 1 — desbloquear o build (isolada, sem dependências)**
Remover de `database.types.ts` e `admin-db.ts` as tabelas legadas já descomissionadas; manter só o que existe no banco. Regenerar o snapshot de tipos.

**Etapa 2 — parar de gerar lixo e destravar a coleta (depende de 1)**
Aplicar o filtro de escopo no produtor, em `five-dollar-sports-sync.server.ts`, antes de enfileirar `API_FOOTBALL_LINK`, eliminando os 58 jobs mortos por `scope_excluded`. Reprocessar/limpar a fila morta e alinhar o limite local ao plano contratado.

**Etapa 3 — corrigir a regra de 00:00 das anotações (independente de 2)**
Trocar o critério de `auto_close_sports_reviews` para a data local do `kickoff_at` (ou um `match_ended_at` derivado do fim real), em vez de `finished_at` de ingestão. Migration + teste pgTAP que fixa um jogo de ontem e prova o fechamento hoje.

**Etapa 4 — antecipar a coleta (depende de 2)**
Adiantar/duplicar o sync diário para logo após a virada local, para que a agenda do dia e os resultados da véspera estejam prontos antes de o usuário abrir o app.

**Etapa 5 — preencher os vazios de /analytics (depende de 2)**
Criar o job de classificação (`sports_standings`) e ligar `syncApiFootballPlayerSeason` a um job real, respeitando o orçamento de requisições. Enquanto não houver dado, a tela deve dizer "coleta ainda não disponível", não "sem dados".

**Etapa 6 — transmissões de /hoje (depende de 2)**
Decidir a fonte. Sem provedor com termos verificados, a opção honesta é entrada manual auditada gravando em `sports_broadcast_evidence` com fonte e horário de verificação. Não inventar canal.

**Etapa 7 — briefing diário (depende de 4 e 5)**
Gerar `sports_daily_briefings`/`sports_briefing_items` por job após o sync, para o noticiário deixar de ser apenas resultados + Elo.

**Etapa 8 — observabilidade e UX (depende de 2 a 7)**
Expor frescor e falha de coleta nas telas: última atualização por domínio e aviso explícito quando a última tentativa falhou. Distinguir "vazio" de "quebrado".

**Etapa 9 — /elo (independente)**
Chave de lista estável, rank global sempre vindo do servidor, chips derivados dos próprios times e regra explícita para times com rating em mais de uma liga.

**Etapa 10 — testes (transversal, fecha o ciclo)**
Substituir os contratos textuais por testes que executem os read-models contra um cliente de banco simulado; cobrir worker e política de retry; rodar toda a pasta `supabase/tests` em CI; e um teste de navegador autenticado com dado semeado que reprove tela vazia.

## Notas técnicas

- Crons ativos hoje: `sports-intelligence-maintenance` */15, `sports-job-worker-kick` * * * * *, `sports-daily-sync-yesterday` 20 8 * * *, `sports-daily-sync-today` 40 8 * * *, `sports-api-maintenance` 12 */6 * * *, `elo-daily-finalize` 5 8 * * *, `elo-daily-incremental` */2 6-7 * * *. Crons legados de análise/apostas: removidos.
- Volumes atuais: 88 fixtures, 50 encerradas, 176 times, 467 jogadores, 400 escalações, 1.190 eventos, 50 fact packs, 737 ratings Elo de clube, 32 de liga, 11.728 fixtures no ledger Elo.
- Nenhuma alteração de código, banco, RLS ou configuração foi feita nesta auditoria.
