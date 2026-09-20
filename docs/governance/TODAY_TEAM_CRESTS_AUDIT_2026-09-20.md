# Aba Hoje — correção dos escudos ausentes

Data: 20/09/2026

## Problema

A agenda acompanhada tinha 54 equipes, com quatro sem `logo_url` e sem `api_football_team_id`:

- Bolton;
- Norwich;
- West Brom;
- Wolverhampton.

Os quatro clubes pertencem à Championship e aparecem em duas fixtures do dia.

## Estratégia

A correção usa reconciliação canônica com API-Football a partir da própria fixture, sem hardcode de URLs no frontend.

Foi criado o job `API_FOOTBALL_TEAM_MEDIA_LINK`, que:

1. resolve a fixture na API-Football;
2. persiste `api_football_fixture_id`;
3. reconcilia `api_football_team_id` de mandante e visitante;
4. grava `logo_url` com a mídia canônica da API-Football;
5. atualiza o ID API-Football da competição quando disponível;
6. **não** enfileira `API_FOOTBALL_FIXTURE_DATA`.

Assim, a correção dos escudos não amplia a coleta detalhada de jogadores para a Championship e preserva o escopo prospectivo da Etapa 4.

## Aliases

O normalizador compartilhado passa a reconhecer explicitamente:

- Bolton Wanderers → Bolton;
- Norwich City → Norwich;
- West Bromwich Albion → West Brom;
- Wolverhampton / Wolverhampton Wanderers → Wolves.

## Critério de conclusão

A frente só é concluída após gates verdes, merge, sincronização no Lovable, execução dos dois jobs reais e validação de 54/54 equipes com escudo na agenda do dia.

## Ajuste do guard de escopo

Na primeira execução real, o trigger `guard_api_football_job_scope()` terminalizou os dois jobs de mídia porque a regra anterior abrangia qualquer `API_FOOTBALL_%` ligado a fixture fora das seis ligas detalhadas.

A correção versionada cria uma exceção **somente** para `API_FOOTBALL_TEAM_MEDIA_LINK`. `API_FOOTBALL_LINK` e `API_FOOTBALL_FIXTURE_DATA` continuam bloqueados fora do escopo da Etapa 4. Os dois jobs de mídia terminalizados pelo guard anterior são reabertos automaticamente pela migration.
