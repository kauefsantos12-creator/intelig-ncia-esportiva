# Broadcast Sync — 2026-09-17

## Objetivo

Implementar a Parte 2 — Programação / Onde assistir do Motor de Inteligência Esportiva sem transformar ausência de dados em uma falsa afirmação de que não existe transmissão.

## Fonte e evidência

- Fonte primária: FutNaTV (`https://futnatv.net/`).
- A fonte é tratada como evidência editorial de programação, não como verdade imutável.
- Cada canal/plataforma persistido em `sports_broadcast_evidence` mantém `source_kind`, `source_name`, `source_url`, `checked_at`, `confidence` e metadados do matching.
- O sistema não inventa emissora quando a fonte não contém uma transmissão reconhecível.

## Arquitetura

- Novo job: `BROADCAST_SYNC`.
- O job usa a fila existente `sports_jobs`, incluindo lease, fencing, retry, dead-letter e idempotência já validados na Parte 1.
- `public.enqueue_sports_broadcast_sync()` agenda somente o dia corrente em `America/Sao_Paulo`.
- O cron `sports-broadcast-sync-today` dispara a cada duas horas no minuto 17.
- O worker coleta o HTML da fonte, normaliza os itens, faz matching conservador por mandante/visitante e persiste apenas matches não ambíguos.
- Evidências FutNaTV do intervalo sincronizado são substituídas atomicamente por uma nova fotografia da fonte.

## Matching e segurança contra falso positivo

- Normalização remove acentos, pontuação e tokens genéricos de clube.
- Abreviações por prefixo são aceitas apenas com pelo menos três caracteres.
- Mandante e visitante precisam ter score mínimo individual de 0,5.
- O score combinado precisa ser pelo menos 0,7.
- Se os dois melhores candidatos estiverem separados por menos de 0,08, a entrada é marcada como ambígua e não é persistida.
- Fixtures são limitadas a uma janela do dia com tolerância de seis horas para diferenças editoriais de horário da fonte.

## Estado operacional e UX

O domínio `futnatv/broadcasts` usa `sports_sync_state` para separar três situações:

- `READY`: houve sincronização válida; jogos sem evidência podem ser exibidos como transmissão ainda não confirmada.
- `ERROR`: a tentativa mais recente falhou após o último sucesso; a UI avisa que a fonte está temporariamente indisponível.
- `NEVER`: ainda não houve primeira sincronização bem-sucedida; a UI não interpreta ausência como ausência de transmissão.

## Controle de acesso

`public.enqueue_sports_broadcast_sync()` é `SECURITY DEFINER`, com execução revogada de `public`, `anon` e `authenticated`; somente `service_role` recebe `EXECUTE`. O cron do banco pode executar a função como dono da rotina.

## Testes e gates

- Teste unitário do parser FutNaTV e do matching de nomes.
- pgTAP valida existência da RPC, privilégio service-role, tipo de job/FutNaTV na definição e cron ativo.
- Antes de merge: lint, typecheck, architecture/static quality, secret scan, database security, migrations/regressions, unit tests, build, performance/load smoke e browser/accessibility quando aplicável.
- Após merge: confirmar sincronização GitHub/Lovable, migration ativa no Lovable Cloud, executar uma sincronização controlada e validar evidências reais sem falso positivo conhecido.

## Critério de conclusão da Parte 2

A Parte 2 só é considerada concluída quando código + migration estiverem mergeados, o Lovable Cloud tiver aplicado o cron/RPC, um `BROADCAST_SYNC` real tiver terminado, `sports_broadcast_evidence` possuir evidência quando houver match suportado pela fonte e a página Hoje diferenciar corretamente fonte saudável de fonte sem sync/erro.
