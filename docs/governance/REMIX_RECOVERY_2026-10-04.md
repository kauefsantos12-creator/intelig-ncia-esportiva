# Recuperação pós-remix — 04/10/2026

## Contexto
O remix de 01/10/2026 (commit `f600756`) moveu o app para outra conta Lovable e um novo Lovable Cloud (`hefuvmocohhpmnhwpkac`). O banco novo recebeu só o esquema; o repositório perdeu `supabase/migrations/` e as três migrations Drizzle de 28/09/2026.

## Decisão
- As migrations originais voltam como **arquivo histórico** em `supabase/migrations_archive/` (blobs idênticos aos de `63ef081`; as Drizzle renomeadas como `20260928000500/000634/000747_*`).
- `supabase/migrations/` fica reservada para migrations novas. O Lovable atual gera migrations em `drizzle/migrations/`.
- O CI (`ci.yml` e `database-security.yml`) copia o arquivo histórico para `supabase/migrations/` antes de `supabase db start`, restaurando o rebuild completo e as regressões SQL.
- Os testes de contrato que liam migrations passam a apontar para `supabase/migrations_archive/`.

## Motivo
O banco novo não possui `supabase_migrations.schema_migrations`. Se os arquivos voltassem para `supabase/migrations/`, todos apareceriam como pendentes e um pedido de "aplicar migrations pendentes" tentaria reaplicar ~135 arquivos sobre um banco já populado.

## Estado de runtime (04/10/2026)
- `scripts/recuperacao-remix.sql` aplicado: Vault, gatilhos de auth, seeds de configuração e 20 jobs `pg_cron`.
- Carga inicial 5Dollar validada (agenda ontem/hoje/amanhã); Elo em bootstrap; elencos API-Football enfileirados (plano gratuito).
