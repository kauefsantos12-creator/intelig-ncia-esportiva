# Primeiro relato pessoal — 16/10/2026

Pedido de Kauê: primeiro jogo hoje às 20h, America/Sao_Paulo. Base Git `70f37dd21dc481528766762fbba69f08a8f0cea2`. A prioridade desta entrega é permitir o relato pessoal; não encerra IE-00.05 ou homologação da coleta/editorial. A pergunta opcional sobre o tipo de relato não teve resposta; foi adotado relato pessoal como hipótese explícita e coerente com o pedido.

## Problema e resultado

O PRIMARY tinha zero fixtures em 16/10 e a fila de Anotações só recebia jogos finalizados. O novo caminho **Anotações → Relatos pessoais → Novo relato** permite informar a partida e começar antes ou durante o jogo. Salvar armazena na conta, e selecionar o registro permite continuar/editar. A data/hora é de Brasília, independente do fuso do aparelho; o novo rascunho sugere hoje às 20h e o usuário confirma/edita os dados.

Os relatos são declarados pelo usuário, separados de fixtures oficiais, placares, estatísticas e rankings. Não há inferência de quem jogou ou de resultado. O formulário continua disponível se a fila pós-jogo falhar. A lista informa o limite de 100 relatos recentes; não apaga registros antigos.

## Segurança, preservação e migração

- Autenticação e allowlist Google existentes; servidor deriva identidade da sessão. A nova leitura/gravação usa cliente autenticado, RLS com ownership e conta aprovada. RPC SECURITY INVOKER, sem privilégio emprestado. Sem acesso anon.
- ID gerado no cliente torna repetição segura após perda da resposta; incremento de versão e comparação atômica detectam conflito. Não informar salvo se houve erro ou ausência de confirmação. Texto permanece no formulário em falhas; aviso de saída para alterações pendentes.
- `sports_personal_match_reports` referencia Auth com cascade e integra erase_user_application_data. Acesso a owner/version/timestamps não é gravável diretamente pelo cliente. Não foi criado armazenamento de texto no navegador nem compartilhamento com IA/APIs.
- Migration aditiva criada com Supabase CLI: `20261016123224_personal_match_reports.sql`. Não editar schema_migrations manualmente. Aplicação no PRIMARY somente após PR e gates aprovados; executor e verificação devem ser registrados.
- Reversão funcional por novo commit retirando o ponto de entrada, mantendo dados para recuperação. Não fazer rollback que descarte relatos. Guardar a definição anterior do erasure como evidência; sua extensão apenas inclui o novo domínio.

## Validação e limites

Testes unitários: fuso de Brasília, virada UTC, datas inválidas, campos e limites. pgTAP: criação futura, leitura/edição, repetição idempotente, conflito, conta não aprovada, tentativa de owner forjado, grants, RLS, exclusão e ausência de alteração do catálogo. Testes de navegador do editor usam fixture com dados fictícios e transporte simulado, separados da prova de persistência no banco; abrangem sucesso, reabertura, erro e conflito em desktop/touch. Eles não provam login real ou runtime publicado.

O registro abaixo separa a preparação da comprovação posterior. Não foram executados testes de backup/restore; as metas de RPO/RTO não são garantias alcançadas. Coleta automática permanece bloqueada e a partida real ainda não foi identificada pelo usuário. Não houve publicação nem mensagem ao Lovable nesta implementação via commits.

## Evidência local da preparação

227 testes unitários em 50 arquivos aprovados; tipagem, lint sem erros e fronteiras de arquitetura aprovados. Build concluído, orçamento de bundle aprovado (maior JS 73,5 KiB gzip; CSS 11,5 KiB gzip), smoke HTTP com 60 requisições e concorrência 10, sem erros. Nenhuma credencial ou texto pessoal real usado.

A tentativa local dos novos testes de navegador foi bloqueada por indisponibilidade do binário/download Chromium; não foi tratada como PASS. A matriz remota e os 22 testes pgTAP novos continuam gates da PR. Esses testes locais não certificam o PRIMARY ou login Google real.

## Integração e prova no PRIMARY — 16/10/2026, 13h23 de Brasília

- [PR #24](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/pull/24) integrada por merge, sem reescrever história. Head testado `3e1755e37c5e6a246105ea278a27368e91ace53f`; merge main `5983b66cb0214e0208b57c2d238524377ef2e19a`; árvore `57dd560e7941b9fa3596e31cfb8748f6ded344de`.
- Todos os quatro checks do head aprovados: static-diagnostics, test-and-build, rls-regression, Browser compatibility and accessibility. [CI 38930697323](https://github.com/kauefsantos12-creator/intelig-ncia-esportiva/actions/runs/38930697323): 249 testes SQL em 24 arquivos; 227 unitários em 50; navegador 63 aprovados e 9 skips existentes. Os 16 cenários novos do editor passaram em oito perfis. Build, orçamento (maior JS 74,6 KiB gzip; CSS 11,5 KiB) e smoke de carga aprovados. Correções mantiveram gates: servidor/cache isolados para a fixture e label explícito do textarea, estável após edição/reabertura.
- Lovable conectado confirmou latest_commit_sha igual ao merge main. Sincronização comprovada; metadado ready não é prova de publicação nem de login.
- Executor: Codex, pela operação SQL do conector Lovable do projeto `428fa571-e363-4bbf-ab2c-058451eba7dc`, PRIMARY `hefuvmocohhpmnhwpkac`. Banco habilitado, identidade aprovada configurada e tabela nova ausente no preflight. Aplicado o SQL exato de `20261016123224_personal_match_reports.sql`, SHA-256 `3962f9636a9384a2c3d68f806e8d852e8b8573ab70aea08afbf8f479b2a74de2`, após gates/merge. Nenhuma edição manual de schema_migrations.
- Verificação estrutural: tabela com RLS, quatro políticas, índice por owner/atualização, FK Auth cascade, RPC invoker; anon sem leitura/execute; cliente sem UPDATE de owner/version ou execute do erasure administrativo.
- Ensaio transacional sob role authenticated: criar, ler, editar, repetir criação/edição sem duplicação, rejeitar versão antiga, impedir leitura/gravação de outra identidade e preservar catálogo. Resultado PASS e ROLLBACK. Não executado erasure na conta real. Verificação independente às `2026-10-16T16:23:46Z`: zero relatos e zero linhas sintéticas, fixtures preservadas em 584.

### Acesso que ainda exige homologação

Prévia indicada pelo projeto: `https://id-preview--428fa571-e363-4bbf-ab2c-058451eba7dc.lovable.app/anotacoes`, preferencialmente aberta pelo editor autenticado. A requisição HTTP sem sessão deste executor retornou 403; não comprova indisponibilidade para Kauê nem um login bem-sucedido. O navegador remoto não respondeu, portanto não há prova visual de login Google real ou de salvamento pela UI conectada ao PRIMARY. A fixture de navegador e o ensaio SQL são evidências complementares, não um E2E publicado. Publicação permanece não executada, preservando a fase de desenvolvimento por commits.

Resultado desta entrega: código integrado, sincronização e persistência/RLS comprovados; aceite do acesso real à prévia pendente. Não declarar toda a jornada operacional homologada antes desse teste.
