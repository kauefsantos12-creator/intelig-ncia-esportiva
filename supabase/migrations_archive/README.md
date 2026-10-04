# Arquivo histórico de migrations (NÃO APLICAR)

Esta pasta guarda as migrations do projeto original (até o commit `63ef081`, antes do remix de 01/10/2026),
mais as três migrations Drizzle de 28/09/2026 (`resenha_national_team_*`), renomeadas com timestamp para manter a ordem.

- O banco de produção atual (Lovable Cloud `hefuvmocohhpmnhwpkac`) recebeu o esquema por cópia no remix e os dados de configuração por `scripts/recuperacao-remix.sql`. Ele **não** tem histórico de migrations; **não aplique estes arquivos nele**.
- O Lovable deste template gera migrations novas em `drizzle/migrations/`. Esta pasta não é lida por ele.
- O CI copia estes arquivos para `supabase/migrations/` apenas dentro do runner, para reconstruir o banco de teste do zero e rodar `supabase/tests/`.
- Arquivos aqui são imutáveis: correções vão em migration nova, nunca editando um arquivo histórico.
