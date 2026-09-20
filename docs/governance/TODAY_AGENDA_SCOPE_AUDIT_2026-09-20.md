# Aba Hoje — auditoria do recorte da agenda

Data: 20/09/2026

## Risco identificado

A implementação anterior carregava até 300 fixtures de `sports_fixtures` para o dia e só depois aplicava as regras `sports_tracking_rules.always_track` no servidor da aplicação.

No snapshot auditado havia 259 fixtures no catálogo e 27 partidas acompanhadas, portanto nenhuma partida prioritária estava sendo perdida naquele momento. Ainda assim, a ordem das operações era estruturalmente incorreta: em um dia com mais de 300 fixtures, um confronto prioritário poderia ficar fora da amostra antes de o recorte canônico ser aplicado.

## Correção

A agenda passa a usar `public.get_today_tracked_fixtures(p_start,p_end,p_limit)`.

A RPC:

- filtra primeiro o intervalo do dia;
- aplica `enabled=true` e `always_track=true` dentro do banco;
- resolve regras específicas por competição e regras genéricas por país/região/tipo/divisão;
- ordena cronologicamente;
- somente então aplica o limite de exibição;
- retorna competição, times e escudos necessários à superfície;
- é executável apenas por `service_role`.

A fonte de verdade da agenda continua sendo `sports_fixtures`. A mudança altera apenas a ordem correta do recorte e do limite.

## Critério de conclusão

A frente é concluída somente após testes de banco, testes de contrato, CI e segurança verdes, merge, sincronização no Lovable Cloud e validação de que a RPC viva retorna o mesmo conjunto prioritário esperado para o dia.
