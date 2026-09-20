# Aba Hoje — refresh intradiário de status e placar

Data: 20/09/2026

## Problema encontrado no E2E final

Às 15:00 de São Paulo, os 27 jogos acompanhados ainda estavam com status `SCHEDULED`, inclusive partidas iniciadas às 07:30, 08:00, 09:00 e 10:00.

A auditoria do runtime mostrou que `source_fetched_at` dos 27 jogos ainda apontava para 04:35 de São Paulo. O sync diário carregava corretamente a programação pela manhã, mas não havia uma rotina para atualizar status e placares durante o dia.

## Validação manual

Foi executado `kick_sports_daily_sync(0)` no runtime.

Após o refresh, o catálogo passou a refletir corretamente partidas encerradas, ao vivo e futuras, com placares atualizados.

## Correção

O sync canônico do próprio dia passa a ser reutilizado a cada 15 minutos na janela ativa de jogos:

- 06:00–20:45 de São Paulo: `*/15 9-23 * * *`;
- 21:00–23:45 de São Paulo: `*/15 0-2 * * *`.

A função `kick_sports_daily_sync(0)` já possui advisory lock por data, portanto execuções sobrepostas são recusadas com segurança.

Não foi criada uma segunda fonte de status nem um fluxo paralelo de persistência: agenda, status, placar, eventos e stats continuam vindo do sync canônico da 5Dollar.

## Critério de conclusão

A frente só é concluída após:

1. pgTAP/CI verdes;
2. merge e sincronização no Lovable;
3. crons ativos no banco vivo;
4. revalidação da aba Hoje com status coerente ao horário atual.
