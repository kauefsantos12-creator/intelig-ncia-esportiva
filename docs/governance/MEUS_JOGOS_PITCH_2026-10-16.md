# Meus Jogos — campinho e notas pessoais

Pedido de Kauê em 16/10/2026, America/Sao_Paulo: campinho, distribuição tática e atribuição de nota aos jogadores no campo. Base: main `46bd2c7f09b959e2c570e07393d3280b7ab53955`.

## Motivo, comportamento e resultado esperado

A lista de escalação mostra quem está relacionado; o campinho organiza a leitura tática e dá acesso direto à avaliação pessoal. A página única apresenta uma equipe por vez, formação e técnico informados, defesa/meio/ataque, goleiro e reservas separados. Clicar num jogador abre sua nota, que aparece no próprio marcador depois de salvar. A escala existente de 0 a 10 em passos de 0,5 é preservada, incluindo zero e remoção da nota.

A distribuição é **ilustrativa pela formação informada**, com posições aproximadas dentro das linhas; não representa coordenadas observadas, eventos de substituição ou análise tática gerada. Lateral/ala vai à linha de cinco quando há três zagueiros. O desenho exige formação que some dez jogadores de linha, onze titulares e um goleiro identificado. Ausência/inconsistência mantém a lista sem fabricar jogadores. Reservas permanecem fora do desenho titular.

## Participação e persistência

Nota exige a confirmação pessoal “Eu vi este jogador atuar nesta partida” e kickoff já ocorrido. Ser titular ou reserva relacionado não confirma entrada em campo. A confirmação é observação pessoal; não escreve `sports_fixture_player_stats`, minutos, papel titular/reserva ou fatos do provedor.

Reutiliza `sports_match_reviews` e `sports_player_personal_ratings`, com o mesmo owner/RLS e cascade de exclusão. A primeira avaliação cria a própria review PENDING e a marca como assistida, porque o usuário declarou que viu o jogador atuar. Se já existir review, preserva comentário e estado finalizado. A fila automática usa a mesma chave owner/fixture e não cria uma cópia. Remover a nota não apaga observações ou snapshot do provedor. O arquivo anterior continua com seus próprios critérios baseados nos participantes disponíveis no provedor; o novo campinho lê as avaliações diretamente.

Migration gerada pelo CLI: `20261017003131_pitch_player_ratings.sql`. Acrescenta somente a RPC `save_pitch_player_rating`, SECURITY INVOKER, search_path vazio, execute apenas authenticated, sessão aprovada e ownership/RLS existentes. Verifica jogador relacionado à fixture e a uma de suas equipes, intervalo/step, observação explícita, kickoff e review não finalizada. Trava a review e usa token updated_at para rejeitar edição antiga. Retry do mesmo valor é idempotente e não altera token; notas/comentários e snapshot existentes são preservados. Sem tabela nova, nova fonte ou nova estatística.

## Proteção da interface

Trocar entre jogadores/equipes preserva seleções de notas ainda não salvas. Trocar partida ou data pede confirmação de descarte quando há alterações, e fica bloqueado durante salvamento. O preenchimento de relato a partir da partida só substitui o texto após os dois formulários permitirem a troca. Falha/confirmação perdida/conflito mantém a seleção de nota. Notas salvas e rascunho são apresentados separadamente; atualizar para comparar não apaga a escolha local. Review finalizada fica em consulta. Erro ao carregar notas não aparece como ausência de avaliações.

## Validação e ativação

Unitários cobrem formação válida/inválida, goleiro, 4-4-2, 3-5-2, lados, reservas e escala. Testes pgTAP isolados cobrem confirmação, clube/fixture, horário, escala, ownership, criar/editar/ler/remover, retry, conflito, finalização e preservação de comentário, snapshot e estatística oficial. Navegadores exercitam formações, clicar/avaliar, salvar/reabrir/remover com transporte simulado, zero, reserva observado, erro/conflito, rascunho e axe. Todos os gates aplicáveis devem passar na PR; não foram relaxados.

**Banco ativo: ativação pendente de autorização explícita.** A revisão automática rejeitou a tentativa de ensaio no PRIMARY, mesmo com ROLLBACK, por conter DDL, grants e notas de teste em produção sem aprovação explícita. Nenhuma operação dessa tentativa foi executada. Não contornar a rejeição; concluir e integrar código/testes isolados, depois solicitar aprovação para aplicar somente a migration, sem notas sintéticas no banco ativo. A consulta anterior encontrou RPC ausente, 170 reviews, zero notas pessoais, 247 estatísticas e 295 relacionados. Não há alegação de ensaio de escrita ativo aprovado.

O advisor do conector Supabase recusou acesso ao PRIMARY Lovable; verificação via esse advisor permanece não disponível. Estrutura/RLS/grants existentes foram lidos pelo conector Lovable autorizado. Login, transporte PostgREST e salvamento pela UI real não são comprovados por fixtures ou pgTAP. Sem publicação, alteração de cron/worker ou automação externa; fase por commits mantida.

Rollback por novo commit de reversão da UI. Se a função vier a ser aplicada, sua remoção deve ser versionada, preservando todas as notas pessoais já salvas. Nenhum código/gate do roadmap é encerrado por esta entrega parcial.
