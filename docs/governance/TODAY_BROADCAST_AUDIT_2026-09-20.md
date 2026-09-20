# Aba Hoje — auditoria de transmissões

Data: 20/09/2026

## Estado vivo encontrado

A auditoria foi feita contra o código da `main` e o Lovable Cloud.

No recorte do dia em `America/Sao_Paulo`:

- o catálogo possuía 259 fixtures;
- 27 pertenciam ao escopo `always_track`;
- nenhuma das 27 era omitida pelo limite atual de 300 fixtures;
- nenhuma das 27 possuía evidência de transmissão;
- o domínio `futnatv/broadcasts` nunca registrou `last_success_at`;
- os jobs `BROADCAST_SYNC` vinham terminando em `DEAD` após cinco tentativas com o erro `FutNaTV não retornou partidas com transmissão em formato reconhecível.`.

A agenda oficial continua vindo exclusivamente de `sports_fixtures`. Guia de transmissão não cria jogo, não altera horário e não é fonte de verdade da agenda.

## Causa

O adapter do FutNaTV depende de HTML textual contendo horário, mandante, separador `x`, visitante e canal em sequência. O runtime atual da fonte deixou de entregar a agenda nesse formato para o fetch server-side do motor.

O comportamento correto não é concluir que os jogos estão sem transmissão; é registrar indisponibilidade da fonte.

## Correção versionada

O pipeline de transmissão passa a trabalhar em duas camadas:

1. **FutNaTV** continua sendo consultado primeiro.
2. Se não houver agenda reconhecível ou ocorrer falha de transporte, **Futebol na TV** é consultado como fallback agregador.

A evidência persiste a proveniência real em `source_kind`, `source_name` e `source_url`. O estado de sync também registra `sourceName`, permitindo que a interface informe qual guia produziu a fotografia válida.

O matching mantém limiar conservador e passa a normalizar abreviações observadas em guias de transmissão, incluindo `At. Paranaense`, `RB Bragantino` e `O. Marseille`.

## Não alterado nesta frente

- existência de fixtures;
- horário/data canônicos;
- competição;
- status agendado/ao vivo/encerrado;
- Elo;
- fórmula da forma recente;
- cron atual de sincronização;
- regras `always_track`.

## Próximos pontos da auditoria Hoje

Dois riscos estruturais foram identificados, embora não estejam truncando dados no snapshot de 20/09:

- a agenda limita 300 fixtures antes de aplicar o escopo `always_track`;
- a forma recente limita 600 jogos globais antes de selecionar os jogos relevantes para cada equipe.

Também existem quatro posições de escudo ausentes entre as 27 partidas acompanhadas do snapshot. Esses pontos devem ser tratados em frentes próprias para manter regressão e diagnóstico isolados.

## Critério de conclusão

Esta frente de transmissão só pode ser considerada concluída quando:

1. CI, Static diagnostics e Database Security estiverem verdes;
2. o PR estiver mergeado na `main`;
3. o Lovable estiver sincronizado no commit de merge;
4. o runtime executar um `BROADCAST_SYNC` real com a versão nova;
5. `sports_sync_state.last_success_at` for preenchido;
6. `sports_broadcast_evidence` contiver evidência para fixtures compatíveis com o guia;
7. a aba Hoje exibir a proveniência e os canais sem transformar falha de fonte em “sem transmissão”.
