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

CI completo, integração, sincronização, aplicação de migration e ensaio no PRIMARY: **PENDENTES nesta preparação**. Não foram executados testes de backup/restore; as metas de RPO/RTO não são garantias alcançadas. Coleta automática permanece bloqueada e a partida real ainda não foi identificada pelo usuário. Nada será publicado ou enviado ao Lovable por mensagem nesta implementação via commits.

## Evidência local da preparação

227 testes unitários em 50 arquivos aprovados; tipagem, lint sem erros e fronteiras de arquitetura aprovados. Build concluído, orçamento de bundle aprovado (maior JS 73,5 KiB gzip; CSS 11,5 KiB gzip), smoke HTTP com 60 requisições e concorrência 10, sem erros. Nenhuma credencial ou texto pessoal real usado.

A tentativa local dos novos testes de navegador foi bloqueada por indisponibilidade do binário/download Chromium; não foi tratada como PASS. A matriz remota e os 22 testes pgTAP novos continuam gates da PR. Esses testes locais não certificam o PRIMARY ou login Google real.
