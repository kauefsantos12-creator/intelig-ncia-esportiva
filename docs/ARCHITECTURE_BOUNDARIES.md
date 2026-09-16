# Architecture boundaries

Este documento registra as fronteiras arquiteturais protegidas pelo gate de governança do CI. Mudanças em domínio, serviços, repositórios, adapters, integrações esportivas ou migrations devem atualizar este documento, `docs/PROJECT_STATE.md` ou `README.md` quando alterarem contratos relevantes.

## Sports intelligence runtime — Parte 4

Estado desta seção: **implementado na branch do PR #162 e aguardando revalidação dos gates; não mergeado, não publicado e não validado em produção**.

### Responsabilidades

- `src/lib/adapters/`: comunicação com provedores externos, incluindo autenticação, rate limit e interpretação de respostas. Não deve decidir estado de negócio da fila.
- `src/lib/sports/`: sincronização canônica, regras de enriquecimento e orquestração dos jobs esportivos.
- Lovable Cloud: fila persistente, leases, idempotência, crons, RPCs protegidas e integridade transacional.
- rotas `/api/...`: fronteira HTTP protegida usada pelos kicks agendados; não substituem as garantias de lease/idempotência do Lovable Cloud.

### Orquestração protegida

- `sports-job-worker-kick`: uma execução por minuto (`* * * * *`).
- Cada execução processa lote pequeno e o adapter respeita o orçamento compartilhado da API-Football.
- O limite distribuído inicia conservador e pode ser ajustado pelos headers de rate limit reportados pelo provedor, mantendo margem operacional.
- `sports-api-maintenance`: a cada 6 horas, no minuto 12 (`12 */6 * * *`), para não consumir desnecessariamente a cota do provedor.
- Jobs de dados de fixture da API-Football ficam disponíveis somente após a janela pós-jogo definida pelo runtime.
- Jobs fora do escopo autorizado da API-Football são terminalizados antes de qualquer chamada ao provedor.

### Garantias que não podem regredir

- claim concorrente usa lock/lease e `SKIP LOCKED`;
- idempotency key não pode representar trabalhos semanticamente diferentes;
- apenas o proprietário de uma lease ativa pode concluir, renovar, falhar ou terminalizar o job;
- retries são limitados e o último erro é persistido de forma controlada;
- jobs `DEAD` permanecem terminais até uma ação explícita de recuperação;
- reexecuções e crons devem ser seguros contra processamento duplicado;
- RPCs operacionais sensíveis permanecem indisponíveis para `anon` e `authenticated`, com execução server-side/service-role.

### Validação

As migrations da Parte 4 devem construir a base do zero e as regressões de `supabase/tests/sports_intelligence/` devem validar os crons finais, o escopo da API-Football, segurança das RPCs, idempotência, leases, retries e terminalização. O gate verde comprova apenas o comportamento em CI/local; publicação e validação no Lovable Cloud continuam sendo etapas separadas.
