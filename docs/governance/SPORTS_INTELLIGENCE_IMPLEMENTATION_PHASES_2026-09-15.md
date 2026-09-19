# Fases de implementação — Motor de Inteligência Esportiva

Atualizado em 19/09/2026.

> **Importante:** este documento registra as **sete fases históricas do reescopo de produto** concluídas em 15–16/09/2026. Ele não usa a mesma numeração das etapas operacionais de dados iniciadas depois. Na trilha operacional atual, por exemplo, **Etapa 3 = elencos (116/116)** e **Etapa 4 = coleta prospectiva por fixture**. O estado vivo dessas etapas fica em docs/PROJECT_STATE.md.

| Fase histórica | Entrega | Estado |
| --- | --- | --- |
| 1 | Fundação: cálculos determinísticos, acesso Elo e camada de dados de jogadores | concluída |
| 2 | Elo: clubes/ligas, filtros e histórico point-in-time | concluída |
| 3 | Hoje: agenda transmitida, normalização multi-source e sinais pré-jogo | concluída |
| 4 | Anotações: fila pós-jogo, watched/not watched, notas pessoais e campinho persistente | concluída |
| 5 | Analytics 2026/27: time, competição, elenco, jogadores e recortes por torneio | concluída |
| 6 | Noticiário: fact packs, resenha diária e movimentos relevantes de Elo | concluída |
| 7 | Corte do produto anterior: jobs, navegação e runtime de apostas descomissionados | concluída |

## Critério de conclusão

Conclusão de fase não significa apenas código escrito:

implementado ≠ testado ≠ mergeado ≠ sincronizado ≠ publicado ≠ validado em produção

Mudanças de código seguem **branch → PR → gates verdes → merge → sincronização Lovable → publicação quando necessária → validação viva**.

## Continuidade operacional após o reescopo

A evolução atual usa outra trilha:

- **Etapa 3 — Elencos:** 116/116 clubes das seis ligas prioritárias validados;
- **Etapa 4 — Dia Zero prospectivo:** lineups e estatísticas individuais por fixture somente nessas seis ligas;
- **Etapa 4.5 — Agenda/Programação:** auditoria de jogos e horários após o primeiro fluxo real da Etapa 4;
- **Etapa 5 — Analytics:** consolidação do histórico prospectivo em inteligência esportiva.

Consultar docs/PROJECT_STATE.md e docs/governance/STAGE4_PROSPECTIVE_FIXTURE_COLLECTION_2026-09-19.md para o estado atual.
