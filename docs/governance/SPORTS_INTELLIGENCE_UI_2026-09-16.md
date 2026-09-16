# UI do Motor de Inteligência Esportiva — 16/09/2026

## Objetivo

Definir a identidade visual vigente do produto para as superfícies Noticiário, Hoje, Elo, Analytics, Anotações e Conta, com leitura confortável em desktop, mobile e PWA.

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

## Implementação

Os tokens globais vivem em `src/styles.css`. Componentes devem consumir os tokens sem duplicar cores literais sempre que possível.

A tipografia usa IBM Plex Sans para interface e IBM Plex Mono para números, métricas e pequenos rótulos técnicos. Estados de foco visível, reduced motion e contraste mínimo permanecem protegidos por testes automatizados.

## Navegação

- desktop: navegação principal horizontal no header;
- mobile/PWA: bottom navigation com cinco superfícies;
- Conta e Sair: utilidades globais fora da navegação primária;
- teclado virtual: bottom navigation é ocultada quando necessário para não competir com campos de entrada.

## Regressão

A paleta e os principais contratos visuais continuam cobertos por testes de tema, tipografia, responsividade, Chromium, Firefox, WebKit e acessibilidade WCAG 2.2 AA automatizada.
