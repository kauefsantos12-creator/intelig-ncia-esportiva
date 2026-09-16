# Definition of Done — Fundação do Motor de Inteligência Esportiva

Data: 15/09/2026

A fundação é considerada completa somente quando todos os itens abaixo estiverem implementados, testados e cobertos pelos gates do repositório. Ela não inclui frontend, migrations destrutivas ou publicação parcial do novo produto.

## Contratos de produto

- Temporada inicial canônica: `2026/27`.
- Áreas canônicas: Noticiário, Hoje, Elo, Analytics e Anotações.
- 5Dollar permanece a fonte principal para fixtures, resultados, eventos e estatísticas agregadas de equipe que estiverem disponíveis no plano contratado.
- API-Football é a camada complementar de jogadores: lineups/formação, participantes, minutos, estatísticas individuais, elenco e lesões quando a cobertura do endpoint existir.
- Elo continua próprio e é tratado separadamente de qualquer nota de provedor.
- Dados ausentes permanecem ausentes; o sistema não deve inferir estatísticas que a fonte não forneceu.

## Sports analytics

- Expectativa de resultado por Elo com ajuste explícito de mando.
- Momento recente medido contra a expectativa Elo, com decaimento temporal e meia-vida inicial de 21 dias.
- Força do calendário baseada no Elo dos adversários.
- Forma, ataque e defesa com preservação explícita de valores ausentes.
- Métricas comparáveis entre ligas devem ter versão relativa à média da competição.
- Curiosidades de desempenho são geradas por regras determinísticas, não por geração livre de texto.
- Movimentos significativos de Elo são detectados com limiar explícito e auditável.

## Transmissão

- A UI nunca consome diretamente um site agregador.
- Toda evidência passa por backend -> normalização -> Lovable Cloud -> consumo do produto.
- Ordem inicial de confiança: `OFFICIAL > FUTNATV > AGGREGATOR > MANUAL`.
- Divergências são preservadas como conflitos; não são descartadas silenciosamente.
- Toda evidência mantém proveniência, horário de checagem e confiança.

## Anotações

- Jogo elegível: existe na programação de transmissão OU pertence ao conjunto `always_track`.
- `watched=false` não cria notas artificiais; comentário e ratings permanecem `NULL`.
- Nota pessoal aceita `NULL` ou valores de `0` a `10` em passos de `0,5`.
- Só atletas classificados como participantes entram na média pessoal.
- A média do time só é exibida quando todos os participantes elegíveis receberam nota válida.
- Participação é conservadora: minutos positivos confirmam participação; titular confirmado em jogo encerrado também confirma; ausência de evidência suficiente vira `UNKNOWN`, não `DID_NOT_PLAY`.
- Fechamento automático só alcança partidas encerradas, ainda pendentes e finalizadas antes do cutoff. Jogos ao vivo ou sem confirmação de encerramento nunca são autoarquivados.

## Dados e confiabilidade

- Fixture possui identidade canônica baseada em provedor primário + fixture id, sem depender de nomes textuais de clubes.
- Jobs de backend usam chave de idempotência determinística por tipo de trabalho + fixture + versão.
- Status de partida é normalizado para: `SCHEDULED`, `LIVE`, `FINISHED`, `POSTPONED`, `CANCELLED`, `UNKNOWN`.
- Status desconhecido permanece `UNKNOWN`; não é promovido para encerrado por heurística.
- Classes de dado têm política explícita de freshness, stale-while-revalidate e expiração.
- Toda informação externa persistida deve carregar proveniência suficiente para auditoria.

## Elo

- Ranking global de clubes usa `elo_global_team_ratings` enquanto existir o modelo atual.
- Ranking de ligas usa `elo_league_ratings`.
- Histórico de variação de equipes é derivado de `elo_fixture_history` e sempre identifica qual rating está sendo exibido.
- Histórico de 60 dias e movimentos relevantes fazem parte do contrato da futura interface, mas a interface não faz parte desta fundação.

## Segurança e arquitetura

- Credenciais de 5Dollar/API-Football ficam exclusivamente server-side.
- Adapters de provedores não são importados no bundle do browser.
- Rate limit, retry, timeout e cache continuam reutilizando a infraestrutura compartilhada do projeto.
- Não se criam dependências do novo domínio em odds, banca, stake, EV, CLV ou seleção de apostas.

## Critério final

A fundação só pode ser mergeada quando CI, testes unitários, regressão de banco, build, segurança, arquitetura, performance e browser/accessibility aplicáveis estiverem verdes no head final da PR.

Depois do merge desta fundação, o próximo eixo é uma migration de limpeza governada do backend/Lovable Cloud legado, seguida da criação das estruturas canônicas do novo produto. Frontend e UX permanecem fora de escopo até o backend estar validado ponta a ponta.
