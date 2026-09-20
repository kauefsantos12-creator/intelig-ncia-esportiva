# Aba Hoje — auditoria da forma recente

Data: 20/09/2026

## Risco identificado

A implementação anterior carregava os 600 jogos encerrados mais recentes de todo o catálogo em uma janela de 90 dias e só depois selecionava, no servidor da aplicação, os jogos pertencentes às equipes da agenda de hoje.

No snapshot auditado a janela possuía 531 jogos encerrados, portanto o limite global de 600 ainda não removia partidas relevantes. Ainda assim, a ordem era estruturalmente incorreta: quando o catálogo ultrapassasse 600 jogos encerrados na janela, uma partida necessária para calcular a forma de um time de hoje poderia ser descartada antes do filtro por equipe.

## Correção

A superfície passa a usar `public.get_recent_team_fixtures(p_team_ids,p_since,p_until,p_per_team)`.

A RPC:

- recebe somente os IDs das equipes presentes na agenda acompanhada;
- busca apenas jogos `FINISHED` dessas equipes;
- exige placares completos;
- ordena cada equipe por kickoff decrescente;
- limita de forma independente por equipe;
- deduplica fixtures compartilhadas por duas equipes da agenda;
- retorna no máximo os jogos necessários para a forma recente;
- é executável somente por `service_role`.

O cálculo exibido permanece igual: últimos 5 jogos anteriores ao kickoff da partida, com vitórias, empates, derrotas, gols pró/contra e sequência W/D/L. A busca usa uma guarda operacional de até 365 dias para não transformar “últimos 5” em “jogos dos últimos 90 dias”; o limite funcional continua sendo 5 por equipe.

## Critério de conclusão

A frente só é concluída após pgTAP, contrato de frontend, CI e segurança verdes, merge, sincronização no Lovable Cloud e validação da RPC viva com as equipes do snapshot atual.
