# Anotações — superfície pós-jogo

Data: 2026-09-16

## Objetivo

Transformar a aba **Anotações** em um fluxo pessoal pós-jogo, preservando a separação entre dados oficiais compartilhados e interpretação privada do usuário.

## Fluxo

1. `enqueue_finished_sports_reviews(owner)` inclui na fila somente partidas encerradas elegíveis, sem duplicação por usuário.
2. O usuário informa se assistiu ou não à partida.
3. Se assistiu, pode registrar comentário geral, notas pessoais dos participantes e marcações no campinho.
4. Notas de jogador seguem escala de 0 a 10 em passos de 0,5 e só podem existir para `PARTICIPATED`.
5. O campinho armazena coordenadas percentuais, jogador opcional e nota livre; não altera eventos, escalações ou estatísticas oficiais.
6. Ao finalizar, o review passa a `COMPLETED`. Se a partida não foi assistida, ratings e marcações pessoais são descartados e o comentário permanece vazio.

## Dados

### Existentes

- `sports_match_reviews`: watched/not watched, comentário, estado e finalização;
- `sports_player_personal_ratings`: participação, nota pessoal, snapshot do rating do provedor e nota textual;
- `sports_fixture_player_stats`: fonte canônica de participantes/minutos/rating do provedor;
- `enqueue_finished_sports_reviews`: seleção server-side das partidas elegíveis.

### Novo

`sports_review_field_marks` registra somente observações pessoais do campinho:

- `review_id`;
- `player_id` opcional;
- `x_percent` e `y_percent` entre 0 e 100;
- `note` opcional.

A tabela possui RLS e herda a propriedade do `sports_match_reviews` pai.

## Segurança e privacidade

- todas as server functions exigem `requireSupabaseAuth`;
- qualquer mutação valida explicitamente que o review pertence a `context.userId`;
- `anon` não possui acesso às anotações;
- RLS impede leitura ou mutação cruzada entre proprietários;
- o campinho é interpretação pessoal e nunca é promovido a dado oficial da partida.

## UX

- fila, loading, erro/retry e estado vazio são explícitos;
- controles de watched/not watched usam estado persistente;
- inputs ficam bloqueados após finalização;
- notas e marcações só aparecem quando `watched=true`;
- participantes ausentes geram estado vazio, sem dados fictícios;
- mobile mantém alvos de toque mínimos e o campo usa coordenadas relativas para funcionar em diferentes larguras.

## Validação

A mudança só pode ser mergeada com:

- lint/typecheck/architecture verdes;
- migrations e testes `sports_intelligence` verdes;
- teste de RLS/constraints do campinho verde;
- unitários e contrato da superfície verdes;
- build, performance, carga, Chromium, Firefox, WebKit e acessibilidade verdes.
