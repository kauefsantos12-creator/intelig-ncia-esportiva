# UI do Motor de Inteligência Esportiva — 16/09/2026

## Objetivo

Definir a identidade visual e os contratos de UX vigentes do produto para as superfícies Noticiário, Hoje, Elo, Analytics, Anotações e Conta, com leitura confortável em desktop, mobile e PWA.

## Paleta

- background principal: `#08110F`
- superfície/card: `#111E1A`
- superfície elevada/secundária: `#162720`
- verde principal: `#2DD4A3`
- verde de destaque/hover/sucesso: `#3BE0B1`
- verde profundo/muted: `#12372C`
- borda: `#243B32`
- texto principal: `#F2F7F5`
- texto secundário: `#94AFA5`
- erro: `#F87171`
- atenção: `#FBBF24`

## Princípios

1. O verde representa ação, destaque e estado positivo sem dominar todas as superfícies.
2. Vermelho e âmbar são reservados para estados semânticos de erro e atenção.
3. O fundo escuro reduz brilho e favorece leitura prolongada de dados esportivos.
4. Cards, bordas, grade e sombras são discretos para priorizar partidas, ratings, estatísticas, notícias e anotações.
5. A camada visual não altera modelos, Elo, integrações, jobs, autenticação ou regras de negócio.
6. Mobile-first, safe-area e alvos de toque mínimos de 44 px são requisitos permanentes.
7. Detalhes técnicos usam progressive disclosure para preservar clareza da tarefa principal.
8. O frontend não exibe textos internos de implementação, placeholders técnicos ou partidas/dados fictícios como se fossem conteúdo real.
9. Loading, vazio e erro são estados distintos e devem ser representados explicitamente.
10. Filtros devem ser progressivos e manter contexto suficiente para o usuário entender o recorte ativo.

## Implementação

Os tokens globais vivem em `src/styles.css`. Componentes devem consumir os tokens sem duplicar cores literais sempre que possível.

A tipografia usa IBM Plex Sans para interface e IBM Plex Mono para números, métricas e pequenos rótulos técnicos. Estados de foco visível, reduced motion e contraste mínimo permanecem protegidos por testes automatizados.

A fundação de componentes está organizada em:

- `AppShell.tsx`: shell, navegação, safe-area e comportamento com teclado virtual;
- `ProductSurface.tsx`: cabeçalhos, cards, seções e métricas;
- `SurfaceState.tsx`: estados canônicos de vazio, loading, erro e mensagens inline;
- `ProductControls.tsx`: chips de filtro, controles segmentados, busca e badges de estado;
- `CollapsiblePanel.tsx`: progressive disclosure de conteúdo detalhado.

## Navegação

- desktop: navegação principal horizontal no header;
- mobile/PWA: bottom navigation com cinco superfícies;
- Conta e Sair: utilidades globais fora da navegação primária;
- teclado virtual: bottom navigation é ocultada quando necessário para não competir com campos de entrada.

As cinco superfícies primárias são canônicas e não devem ser renomeadas sem revisão de arquitetura de informação:

1. Noticiário;
2. Hoje;
3. Elo;
4. Analytics;
5. Anotações.

## Estados de interface

### Loading

- deve indicar que o carregamento está em andamento sem provocar layout shift excessivo;
- usa `role="status"`, `aria-live="polite"` e `aria-busy="true"` quando apropriado;
- skeletons representam estrutura, não conteúdo inventado.

### Vazio

- explica por que ainda não há conteúdo e o que aparecerá naquela região;
- não usa dados fictícios para preencher a tela;
- ações só aparecem quando houver uma próxima ação real para o usuário.

### Erro

- usa linguagem simples e contextual;
- expõe retry quando a operação puder ser repetida com segurança;
- estados críticos usam `role="alert"`.

## Controles e filtros

- chips usam `aria-pressed` para seleção persistente;
- grupos segmentados têm rótulo acessível;
- buscas possuem nome acessível independente de placeholder;
- listas horizontais de filtros podem rolar localmente em telas estreitas, sem causar overflow global;
- filtros desabilitados precisam indicar visualmente indisponibilidade.

## Densidade

- cards principais usam densidade `default`;
- blocos secundários podem usar `compact` ou tom `subtle` para reduzir competição visual;
- tabelas densas continuam restritas a contextos em que a leitura tabular seja superior a cards.

## Regressão

A paleta e os principais contratos visuais continuam cobertos por testes de tema, tipografia, responsividade, Chromium, Firefox, WebKit e acessibilidade WCAG 2.2 AA automatizada.

`src/frontend-foundation-contract.test.ts` protege adicionalmente:

- navegação canônica A–E;
- estados de loading/vazio/erro;
- filtros e busca touch-safe;
- cards com associação acessível de título;
- ausência de placeholders de implementação e fixtures fictícias nas superfícies principais.
