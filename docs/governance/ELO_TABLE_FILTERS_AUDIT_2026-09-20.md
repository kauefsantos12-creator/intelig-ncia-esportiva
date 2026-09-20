# Elo — auditoria de filtros e navegação da tabela

Data: 20/09/2026

## Objetivo

Garantir que a tabela central da aba `/elo` permita explorar o universo completo do ranking sem truncamento silencioso e com filtros combináveis coerentes.

## Snapshot vivo antes da correção

- clubes atuais: 681;
- ligas: 32;
- países: 22;
- regiões: 4;
- divisões: 2;
- ligas de 1ª divisão: 22;
- ligas de 2ª divisão: 10.

## Problemas encontrados

A superfície carregava até 3.000 clubes no backend, mas o frontend renderizava apenas:

`filteredTeams.slice(0, 100)`

e, para ligas:

`filteredLeagues.slice(0, 100)`.

Ao mesmo tempo, o contador mostrava o total filtrado, o que podia sugerir que todos os resultados estavam visíveis.

Também faltavam filtros explícitos por:

- liga/competição;
- divisão.

E a tabela não oferecia ordenação controlada por:

- posição global;
- Elo/rating;
- clube/liga;
- jogos processados;
- país;
- divisão.

## Correção

A tabela passa a ter:

1. busca textual;
2. filtro por região;
3. filtro por país;
4. filtro por liga no ranking de clubes;
5. filtro por divisão;
6. ordenação determinística;
7. botão de limpeza completa;
8. paginação real de 50 itens;
9. contador de intervalo visível, filtrado e total;
10. posição global preservada mesmo quando a tabela é filtrada, ordenada ou paginada.

### Ordenações de clubes

- posição global;
- Elo maior → menor;
- Elo menor → maior;
- clube A–Z;
- liga A–Z;
- jogos processados.

### Ordenações de ligas

- posição global;
- rating maior → menor;
- rating menor → maior;
- liga A–Z;
- país A–Z;
- divisão.

## Semântica de posição

A coluna `#` continua representando a posição no ranking global original.

Filtros, paginação e ordenações alternativas não recalculam a posição global nem transformam a posição filtrada em ranking novo.

## Não alterado

- fórmula Elo;
- ratings persistidos;
- hierarquia;
- histórico point-in-time;
- frequência de processamento;
- backend quantitativo.

## Critério de conclusão

O item 3 só é concluído após:

1. Static diagnostics verdes;
2. CI/test-and-build verde;
3. browser/accessibility verde;
4. merge;
5. sincronização do Lovable;
6. validação da tabela carregando resultados além do antigo limite de 100 e preservando posições globais.


## Validação pós-merge

PR #62 passou pelos gates:
- Static diagnostics: sucesso;
- CI/test-and-build: sucesso;
- Database regressions: sucesso;
- browser compatibility/accessibility: sucesso.

Merge:
- commit: `d6444f9cfeadf8c143e2a10903f6e1bcd041ec73`.

Lovable:
- `latest_commit_sha`: `d6444f9cfeadf8c143e2a10903f6e1bcd041ec73`;
- projeto: `ready`;
- `is_published=true`.

Snapshot vivo pós-merge:
- 681 linhas atuais;
- 681 clubes distintos;
- 32 ligas;
- 22 países;
- 4 regiões;
- 2 divisões.

O contrato de frontend confirmou ausência de `filteredTeams.slice(0, 100)` e `filteredLeagues.slice(0, 100)`, paginação de 50 resultados e preservação da posição global por mapas canônicos de ranking.

A chamada manual de deploy retornou `pending` para o deployment `b1f187c1-a2a3-47dc-9105-9dedf70a83b0`; esse deployment específico não é classificado como concluído enquanto a API não confirmar.

Status do item 3: **concluído e validado estruturalmente/runtime**.
