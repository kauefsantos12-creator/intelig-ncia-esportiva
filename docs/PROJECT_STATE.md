# Motor de Inteligência Esportiva — estado canônico

> Atualizado: 16/09/2026  
> Repositório: `kauefsantos12-creator/quant-football-insights`  
> Lovable canônico: `28664075-8af4-4155-9ee9-8ed86021681a`  
> Produção: `https://quant-football-insights.lovable.app`

Este documento registra o estado vigente do produto. Auditorias e migrations antigas preservam a trilha histórica, mas não representam o runtime atual quando contradizem o `main` ou o estado vivo do Lovable Cloud.

## Fontes de verdade

- **GitHub `main`**: código, testes, migrations, contratos e documentação versionados.
- **Lovable Cloud**: banco/runtime e estado operacional vivos.
- **Lovable**: aplicação canônica ligada a este repositório.

Regra obrigatória:

```text
implementado ≠ testado ≠ mergeado ≠ sincronizado ≠ publicado ≠ validado em produção
```

## Produto vigente

O sistema é um **Motor de Inteligência Esportiva**, sem fluxo ativo de apostas, odds, banca, picks, stake ou execução financeira.

Superfícies atuais:

1. **Noticiário** — resenha diária, fact packs e movimentos relevantes de Elo.
2. **Hoje** — agenda, transmissão e contexto pré-jogo.
3. **Elo** — clubes, ligas, filtros e histórico point-in-time.
4. **Anotações** — fila pós-jogo, watched/not watched, comentários, notas pessoais e campinho.
5. **Analytics 2026/27** — times, competições, elenco, jogadores e recortes por torneio.
6. **Conta/Privacidade** — autenticação single-user e controles de privacidade.

## Estado das sete fases

| Fase | Estado |
| --- | --- |
| 1. Fundação | concluída |
| 2. Elo | concluída |
| 3. Hoje | concluída |
| 4. Anotações | concluída |
| 5. Analytics 26/27 | concluída |
| 6. Noticiário | concluída |
| 7. Corte do produto anterior | concluída |

Cada fase passou pelo fluxo de branch/PR/gates antes do merge quando exigiu alteração de código.

## Backend e dados

O Lovable Cloud contém o domínio esportivo canônico, incluindo:

- competições, equipes e fixtures;
- eventos e estatísticas de partidas;
- jogadores, elencos, lineups e estatísticas individuais;
- evidências de transmissão;
- fact packs e briefings;
- analytics de temporada;
- reviews pessoais e ratings pessoais;
- marcações pessoais do campinho;
- jobs, sync state e infraestrutura operacional;
- Elo de clubes e ligas.

Integrações esportivas permanecem normalizadas e server-side. Jobs usam idempotência, leases/retries e proteção contra processamento duplicado.

## Elo

O Elo preservado é parte do produto atual. A aplicação oferece:

- rating global de clubes;
- rating de ligas com hierarquia entre divisões;
- comparação cross-league;
- histórico point-in-time;
- ranking com filtros geográficos;
- sincronização protegida no backend.

A UI não recalcula Elo no cliente.

## Anotações pessoais

A superfície `/anotacoes` está funcional.

Fluxo:

- partidas encerradas elegíveis entram na fila via `enqueue_finished_sports_reviews`;
- usuário marca assistiu/não assistiu;
- pode escrever comentário geral;
- pode atribuir notas de 0 a 10 em passos de 0,5 a jogadores que participaram;
- pode registrar marcações no campinho com coordenadas relativas e jogador opcional;
- pode finalizar o review;
- dados pessoais nunca alteram estatísticas, eventos, lineup ou rating oficial.

Segurança:

- ownership validado server-side;
- RLS owner-scoped;
- `anon` sem acesso;
- `sports_review_field_marks` possui quatro policies por proprietário.

## Corte do produto anterior

A migration `20260916013000_sports_intelligence_legacy_cleanup.sql` descomissionou o runtime anterior sem reescrever a história do banco.

Foram retirados do ambiente ativo:

- jobs exclusivos de análise/apostas;
- tabelas de analysis runs, picks/seleções, odds, banca, value e tracking de apostas;
- RPCs do funil antigo;
- capacidades e métricas exclusivamente financeiras/de aposta;
- rotas e módulos executáveis legados.

Preservados:

- migrations históricas;
- auditorias históricas;
- Elo;
- autenticação, RLS, privacidade e governança;
- infraestrutura esportiva e de provedores;
- push genérico;
- telemetria e performance.

Contratos automatizados impedem reintroduzir superfícies de apostas no frontend ativo e verificam a ausência de módulos legados do runtime.

## CI obrigatório

Antes de merge de código, a cadeia cobre:

```text
lint + typecheck + architecture boundaries
→ dependency vulnerability gate
→ secret scan
→ server secret boundary
→ governance documentation gate
→ versioned route tree
→ rebuild das migrations
→ regressões sports_intelligence / RLS
→ unit tests
→ build
→ bundle performance budget
→ concurrent load smoke
→ Chromium + Firefox + WebKit
→ responsividade + acessibilidade
```

## Estado validado em 16/09/2026

### GitHub

- `main` após a conclusão funcional de Anotações: `5a8dd49e68731eb39d61a2c4422843e512092610`.
- PR #12, **feat: complete post-match notes workflow**, mergeada por squash após:
  - Static diagnostics #15: success;
  - Database Security #4: success;
  - CI #18: success.

### Lovable

- projeto canônico sincronizado no mesmo commit `5a8dd49e68731eb39d61a2c4422843e512092610` antes deste PR documental;
- aplicação publicada e reportada como `ready`;
- screenshot atual mostra a identidade **Motor de Inteligência Esportiva** e autenticação privada.

### Lovable Cloud

Validação viva confirmou:

- `sports_match_reviews`: presente;
- `sports_player_personal_ratings`: presente;
- `sports_review_field_marks`: presente;
- migration `20260916220000_sports_review_field_marks`: registrada;
- RLS de `sports_review_field_marks`: habilitado;
- quatro policies owner-scoped: presentes;
- índice `sports_review_field_marks_review_idx`: presente;
- FKs para review e jogador: presentes;
- checks de `x_percent`/`y_percent` entre 0 e 100: presentes;
- `analysis_runs`: ausente;
- `experimental_bet_tracking`: ausente;
- `user_odds`: ausente.

A migration do campinho foi aplicada ao Lovable Cloud após o deploy porque a publicação de código não a havia propagado automaticamente. O SQL aplicado foi exatamente o arquivo versionado `20260916220000_sports_review_field_marks.sql`, e a versão foi registrada no histórico de migrations na mesma transação.

## Limitações de validação

- A tela pública de autenticação foi validada por estado/screenshot do Lovable.
- O fluxo autenticado completo não foi navegado manualmente com uma sessão Google humana nesta execução; sua estrutura foi coberta por CI, testes de banco, contratos e validação viva do schema.
- O nome/descrição internos do projeto no editor Lovable ainda podem exibir o rótulo histórico `Value Bet Finder`; isso não corresponde ao código nem à UI publicada e não altera o runtime.

## Protocolo para continuidade

1. consultar `main` e este documento;
2. consultar o commit atual no Lovable;
3. consultar o Lovable Cloud para banco/jobs/dados;
4. não assumir sincronização ou execução de automações;
5. para código: branch → alteração → PR → gates verdes → merge;
6. depois do merge: confirmar sincronização, publicar se necessário e validar produção;
7. manter migrations/auditorias antigas como trilha histórica, sem tratá-las como arquitetura ativa.
