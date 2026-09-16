# Frontend + UX — fundação do Motor de Inteligência Esportiva

Data: 16/09/2026

Branch: `feat/sports-intelligence-frontend-shell`

Estado: **implementado na branch e aguardando CI/PR; não mergeado nem publicado**.

## Objetivo

Substituir a superfície transitória remanescente por uma arquitetura de informação coerente com o novo produto, sem reintroduzir o frontend legado de apostas.

## Navegação canônica

A experiência principal passa a ser organizada em cinco superfícies:

1. **Noticiário** — resenha esportiva factual e movimentos relevantes de Elo;
2. **Hoje** — agenda de jogos, transmissão e contexto esportivo expansível;
3. **Elo** — rankings de clubes e ligas, hierarquia e histórico point-in-time;
4. **Analytics** — análise por continente, país, competição, time, elenco, jogadores e calendário;
5. **Anotações** — registro pessoal pós-jogo vinculado à fixture canônica.

`Conta` e `Sair` permanecem como utilidades globais, fora da navegação primária.

## Regras de UX

- mobile-first com prioridade para iPhone e PWA;
- bottom navigation fixa em telas menores, respeitando safe-area;
- navegação horizontal no desktop;
- touch targets mínimos de 44 px;
- bottom navigation some quando o teclado virtual ocupa a viewport;
- progressive disclosure para jogos e detalhes analíticos;
- nenhuma superfície deve exibir odds, picks, banca, stake ou outras abstrações do produto antigo;
- estados vazios devem explicar a ausência de dados sem simular conteúdo;
- autenticação, privacidade e RLS existentes permanecem obrigatórios.

## Escopo desta primeira fatia

Esta PR estabelece a arquitetura de informação e o shell visual final:

- atualiza `AppShell` para as cinco superfícies canônicas;
- transforma `/` em Noticiário;
- adiciona `/hoje`, `/elo`, `/analytics` e `/anotacoes`;
- registra as novas rotas no route tree versionado;
- alinha metadados/PWA com a identidade do Motor de Inteligência Esportiva;
- adiciona componentes reutilizáveis de cabeçalho, cards e estados de fundação.

A conexão de cada superfície com consultas server-side reais será feita em fatias posteriores, mantendo o mesmo shell e sem dados mock em produção.

## Guardrails preservados

Esta mudança não altera:

- migrations ou schema do Lovable Cloud;
- Elo ou fórmulas de rating;
- jobs, crons, retries ou idempotência;
- integrações 5Dollar/API-Football;
- autenticação, sessão, RLS ou privacidade;
- regras de negócio do backend esportivo.

Implementado, testado, mergeado, sincronizado, publicado e validado em produção continuam sendo estados distintos.
