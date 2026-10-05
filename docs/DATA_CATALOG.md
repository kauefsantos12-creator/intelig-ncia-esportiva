# Catálogo de fontes de dados

O catálogo operacional vive em `public.source_definitions`. Este documento descreve o contrato de governança.

| Fonte                          | Versão                            | Papel                       | Status           |
| ------------------------------ | --------------------------------- | --------------------------- | ---------------- |
| `five_dollar_football`         | `five-dollar-v1`                  | dados esportivos principais | ACTIVE           |
| `five_dollar_bet365_odds`      | `five-dollar-bet365-odds-v1`      | odds por evento             | ACTIVE           |
| `five_dollar_bet365_day_odds`  | `five-dollar-bet365-day-odds-v1`  | odds por dia                | ACTIVE           |
| `five_dollar_standings_card`   | `five-dollar-standings-card-v1`   | apoio de cartões            | ACTIVE           |
| `five_dollar_standings_corner` | `five-dollar-standings-corner-v1` | apoio de escanteios         | ACTIVE           |
| `research_adapter`             | `research-v1`                     | dados públicos/pesquisa     | ACTIVE/secondary |
| demais adapters preparados     | versão cadastrada                 | referência/fallback         | REFERENCE        |

## Campos obrigatórios de governança

Cada fonte deve ter: `source`, `definition_version`, provider, data owner, data steward, quality tier, expectativa de SLA, `reviewed_at`, `next_review_at` e `governance_status`.

`license_or_terms` deve ser preenchido quando os termos/licença forem comprovados. Ausência de evidência não deve ser preenchida por suposição.

## Linhagem

Novos registros de `raw_observations` e `source_fetches` são aceitos somente quando `source + definition_version` estiver cadastrado. Registros históricos anteriores ao controle podem permanecer como legado até reconciliação, mas não autorizam novas fontes não catalogadas.

## Noticiário — definição editorial de 05/10/2026

`editorial_rss` usa `editorial-rss-v2`: exatamente dois veículos por país, com Kicker/BILD Sport, Marca/AS, BBC Sport/Sky Sports, L'Équipe/RMC Sport, Gazzetta/Corriere dello Sport, A Bola/Record e ge/UOL Esporte. A coleta usa feeds RSS próprios; a atribuição e o domínio do publisher precisam ser aprovados antes da persistência. Trechos de RSS não constituem leitura integral da matéria. Evidências históricas permanecem intactas; fontes fora da lista não alimentam novos textos.

O padrão `editorial-explanatory-v3` integra explicação, relação entre placar e desempenho e protagonista no coletivo. Estatísticas de desempenho do futebol usam somente evidência SofaScore; a disponibilidade dessa evidência não é presumida. O fallback 5Dollar foi desativado exclusivamente na resenha, preservando os dados do motor e seus mapeamentos existentes. Sem estatísticas ou cobertura editorial suficiente, aplica-se a redação factual. Ver `docs/governance/EDITORIAL_REVIEW_STANDARD_2026-10-05.md`.

Validação: regressões de domínio/atribuição, estatísticas ausentes, isolamento de provedores e testes SQL da política. Rollback: restaurar as duas funções da migration anterior mediante nova migration e reverter o código em novo commit. O padrão não altera a automação diária do ChatGPT.

A definição editorial é registrada por `INSERT ... ON CONFLICT`, permitindo aplicar a política também em runtimes restaurados sem o seed histórico de `source_definitions`. A operação preserva os campos existentes de propriedade e licença; não registra outras fontes nem altera as definições do motor.

Os 14 veículos editoriais usam feeds RSS próprios. A descoberta pelo Google News foi substituída após retornar HTTP 503 no ambiente; o parser respeita a codificação declarada no XML, inclusive ISO-8859-1 do Record. A validação de domínio e atribuição continua obrigatória e falhas individuais mantêm o fechamento factual.

A revisão editorial de relógio preserva minutos absolutos da partida (por exemplo, “aos 75 minutos”), sem tratá-los como minutos transcorridos do segundo tempo. Minuto 90 sem acréscimo informado não comprova gol nos acréscimos; a lista de eventos pode ser parcial. Um empate sem gols não autoriza interpretação de bloqueio defensivo sem evidência. Esses limites foram reforçados após a leitura do primeiro rascunho gerado em produção.
