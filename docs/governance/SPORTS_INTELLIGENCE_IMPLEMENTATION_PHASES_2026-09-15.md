# Fases de implementação — Motor de Inteligência Esportiva

Atualizado em 16/09/2026.

| Fase | Entrega | Estado |
| --- | --- | --- |
| 1 | Fundação: cálculos determinísticos, acesso Elo e camada de dados de jogadores | concluída |
| 2 | Elo: clubes/ligas, filtros e histórico point-in-time | concluída |
| 3 | Hoje: agenda transmitida, normalização multi-source e sinais pré-jogo | concluída |
| 4 | Anotações: fila pós-jogo, watched/not watched, notas pessoais e campinho persistente | concluída |
| 5 | Analytics 2026/27: time, competição, elenco, jogadores e recortes por torneio | concluída |
| 6 | Noticiário: fact packs, resenha diária e movimentos relevantes de Elo | concluída |
| 7 | Corte do produto anterior: jobs, navegação e runtime de apostas descomissionados | concluída |

## Critério de conclusão

Conclusão de fase não significa apenas código escrito. O protocolo do projeto distingue:

```text
implementado ≠ testado ≠ mergeado ≠ sincronizado ≠ publicado ≠ validado em produção
```

Mudanças de código seguem **branch → PR → gates verdes → merge → sincronização Lovable → publicação quando necessária → validação viva**.

## Situação em 16/09/2026

As sete fases funcionais do reescopo estão materializadas no produto atual. O frontend ativo não expõe superfícies de apostas, e o Lovable Cloud validado não contém `analysis_runs`, `experimental_bet_tracking` ou `user_odds`.

A superfície de Anotações foi a última lacuna funcional fechada: PR #12 mergeada após CI, Static diagnostics e Database Security verdes. A tabela `sports_review_field_marks` foi posteriormente reconciliada no Lovable Cloud com a migration versionada `20260916220000_sports_review_field_marks.sql` e validada com RLS, quatro policies owner-scoped, índice, FKs e constraints.

O estado operacional detalhado está em `docs/PROJECT_STATE.md`.
