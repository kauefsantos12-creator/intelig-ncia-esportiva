# Noticiário — auditoria de Movimentos de Elo

Data: 20/09/2026

## Problemas encontrados

O card de **Movimentos de Elo** consultava diretamente `elo_fixture_history` sem restringir `model_version`. Como o histórico é versionado, uma mesma fixture pode coexistir em mais de uma versão do modelo e gerar duplicidade ou exibir uma variação antiga.

Além disso, o backend ordenava as partidas por recência, limitava a 100 linhas e somente depois calculava/ordenava os maiores deltas no servidor da aplicação. Em uma janela de 48 horas com mais de 100 fixtures, uma variação relevante mais antiga podia ficar fora do universo avaliado.

## Contrato corrigido

O Noticiário passa a usar `public.get_recent_elo_movements(p_since,p_limit)`.

A função:

- usa apenas o Elo local canônico `elo-v1-w020`;
- transforma cada fixture em movimentos individuais de mandante e visitante;
- aplica o piso de relevância `|delta| >= 2`;
- ordena por `abs(delta)` antes do `LIMIT`;
- mantém a janela de 48 horas definida pelo backend;
- limita a resposta a 8 movimentos no Noticiário;
- é executável apenas por `service_role`.

O frontend deixa explícito que o card mostra **variações do Elo local canônico**, evitando confusão com o Elo global/hierárquico exibido na superfície dedicada `/elo`.

## Regressão

Cobertura adicionada em:

- `src/news-surface-contract.test.ts`;
- `supabase/tests/sports_intelligence/recent_elo_movements.test.sql`.

A mudança só deve ser considerada concluída após CI, Database Security e Static diagnostics verdes e merge na `main`.
