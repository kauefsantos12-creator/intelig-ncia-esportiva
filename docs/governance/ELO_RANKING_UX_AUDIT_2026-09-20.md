# Elo — auditoria de UX do ranking

Data: 20/09/2026

## Objetivo

Melhorar a leitura e identificação visual do ranking sem alterar a semântica dos ratings ou recalcular Elo no frontend.

## Snapshot observado

O ranking atual contém 681 clubes.

Cobertura de identidade visual no catálogo esportivo:

- 164 clubes com `logo_url` canônico;
- 517 clubes sem `logo_url`.

A ausência de logo não pode impedir a exibição do clube.

## Problemas de UX encontrados

- ranking correto, mas com identificação apenas textual;
- posição global exibida como número simples, sem hierarquia visual;
- card do clube selecionado não mostrava escudo, liga e volume de partidas processadas;
- em mobile, a linha ocultava parte importante do contexto;
- falha ao carregar uma imagem poderia deixar a identidade visual inconsistente.

## Correção

### Identidade do clube

`getEloDirectory()` passa a consultar `sports_teams` e mapear `five_dollar_team_id → logo_url`.

A camada é opcional: se a consulta de mídia falhar, o ranking continua carregando.

Na UI:

- usa escudo canônico quando disponível;
- em caso de ausência ou erro de imagem, usa iniciais do clube;
- imagens são lazy-loaded e não carregam texto alternativo redundante porque o nome do clube permanece visível ao lado.

### Posição global

A posição passa a usar um badge visual consistente.

As três primeiras posições recebem ênfase sutil, sem alterar ordenação ou score.

### Clube selecionado

O resumo do clube selecionado passa a mostrar:

- escudo/fallback;
- posição global;
- Elo global;
- liga;
- partidas processadas;
- acesso direto ao histórico de 60 dias.

### Mobile

A linha mantém:

- posição;
- identidade do clube;
- Elo;

e acrescenta no bloco do clube:

- liga;
- quantidade de jogos processados.

## Não alterado

- fórmula Elo;
- ratings persistidos;
- posição global;
- filtros;
- paginação;
- hierarquia de ligas;
- histórico point-in-time;
- frequência do processamento diário.

## Limitação conhecida

Este item não faz backfill massivo de escudos para os 517 clubes sem mídia canônica. O fallback por iniciais é comportamento intencional até que esses clubes sejam reconciliados por fontes canônicas em fluxos próprios.

## Critério de conclusão

O item 4 só é concluído após:

1. Static diagnostics verdes;
2. CI/test-and-build verde;
3. browser/accessibility verde;
4. merge;
5. sincronização no Lovable;
6. validação da cobertura de mídia mantendo 681 clubes e fallback seguro para clubes sem logo.
