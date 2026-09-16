# Frontend + UX — fundação do Motor de Inteligência Esportiva

Data: 16/09/2026

Branch original: `feat/sports-intelligence-frontend-shell`

Estado: **mergeado, sincronizado e publicado**.

## Objetivo

Estabelecer uma arquitetura de informação única para o Motor de Inteligência Esportiva, orientada exclusivamente a futebol, dados esportivos, Elo, analytics e registros pessoais de partidas.

## Navegação canônica

A experiência principal é organizada em cinco superfícies:

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
- todas as superfícies usam somente conceitos do domínio atual de inteligência esportiva;
- estados vazios explicam a ausência de dados sem simular conteúdo;
- autenticação, privacidade e RLS existentes permanecem obrigatórios.

## Fundação implementada

A primeira fatia estabeleceu a arquitetura de informação e o shell visual:

- `AppShell` com as cinco superfícies canônicas;
- `/` como Noticiário;
- `/hoje`, `/elo`, `/analytics` e `/anotacoes`;
- route tree versionado;
- metadados/PWA alinhados à identidade do Motor de Inteligência Esportiva;
- componentes reutilizáveis de cabeçalho, cards, métricas e estados de fundação.

A conexão de cada superfície com consultas server-side reais é feita em fatias incrementais, mantendo o mesmo shell e sem dados simulados em produção.

## Guardrails preservados

A camada de experiência não altera:

- migrations ou schema do Lovable Cloud;
- Elo ou fórmulas de rating;
- jobs, crons, retries ou idempotência;
- integrações 5Dollar/API-Football;
- autenticação, sessão, RLS ou privacidade;
- regras de negócio do backend esportivo.

Implementado, testado, mergeado, sincronizado, publicado e validado em produção continuam sendo estados distintos.
