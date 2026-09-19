# Motor de Inteligência Esportiva — estado canônico

> Atualizado: 19/09/2026  
> Repositório: kauefsantos12-creator/quant-football-insights  
> Lovable canônico: 28664075-8af4-4155-9ee9-8ed86021681a  
> Produção: https://quant-football-insights.lovable.app

Este documento registra o estado vigente do produto. Auditorias e migrations antigas preservam a trilha histórica, mas não representam o runtime atual quando contradizem o main ou o estado vivo do Lovable Cloud.

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

## Limitações e pendências conhecidas

- Em 19/09, o teste real Tottenham x Aston Villa revelou uma falha de identidade de competição: algumas fixtures das seis ligas estão ligadas ao registro canônico 5Dollar, enquanto os IDs API-Football podem estar em um registro irmão da mesma liga. A função de escopo deve reconhecer ambas as identidades de provedor. A correção está sendo versionada em migration própria e deve reabrir apenas jobs prospectivos que foram mortos por esse bug.
- A lógica de agregação de **titularidades (starts)** da view prospectiva ainda precisa ser reconciliada com sports_fixture_lineups; não considerar esse ponto resolvido.
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
