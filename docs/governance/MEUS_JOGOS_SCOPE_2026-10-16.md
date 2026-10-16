# Meus Jogos — foco vigente e primeira implementação

Decisão: Kauê, em 16/10/2026. Base do código: main `f511ddf6210610c7f57e4f178bb2f23e49375c78`. Esta decisão substitui a prioridade Resenha de 15/10; não apaga sua evidência.

## Problema e decisão

Kauê informou: “A resenha segue muito falha. Acredito que seja mais meus jogos apenas e vamos vendo”. O produto passa a evoluir apenas em Meus Jogos, com entregas graduais. Resenha/Noticiário, Hoje separado, Elo e Analytics têm evolução pausada. Preservar código, dados e memória pessoal. Essa pausa não autoriza desligar crons nem alterar a automação esportiva externa do ChatGPT; nenhum deles foi alterado.

## Comportamento implementado

- A entrada `/` e a navegação principal apresentam Meus Jogos, mantendo Conta/Privacidade.
- Data em Brasília, lista das partidas já armazenadas, seleção e leitura de escalação existentes. Falha, carregamento e vazio têm mensagens distintas; não há promessa de agenda completa.
- Escalação separa titulares e reservas por equipe, com números/posições, técnico e formação quando informados. Prefere nomes do snapshot da partida a abreviações do cadastro. Atribui os prints do ge a Kauê. Reserva relacionada não confirma entrada em campo; não cria minutos, estatísticas, notas ou coordenadas táticas.
- Relato privado pode começar preenchendo os times/data da partida ou manualmente. Salvar, reabrir e editar reutilizam o CRUD autenticado já integrado na PR #24. Troca de rascunho pede confirmação; falha não apaga o texto. Não há autosave.
- Falha ao ler partida/escalação não desmonta o editor. Respostas antigas de uma seleção não substituem uma seleção mais recente.
- Anotações, avaliações e campinho anteriores continuam acessíveis pelo histórico. A antiga Home está preservada em `LegacyNewsPage.tsx`, fora da entrada e sem nova rota.

## Fronteiras, dados e recuperação

Consultas passam por `requireSupabaseAuth` e pelo cliente da sessão/RLS. Sem credencial privilegiada na nova leitura. Sem migration, DML, nova fonte, mudança de permissão, API externa, ingestão ou alteração de semântica pessoal. Os 46 relacionados de Mirassol x Internacional e sua origem já foram registrados na PR #27; esta entrega apenas os lê.

Ownership, privacidade, integridade e backup/restore continuam obrigatórios. IE-00.05 permanece pendente e não se encerra nenhum dos 104 códigos do roadmap. Meus Jogos não depende dos finais das superfícies pausadas, elencos completos ou coletor automático; seus próprios fluxos incluídos continuam sujeitos a IE-07, IE-LP2, IE-LP3 e liberação aplicável.

Rollback: novo commit de reversão restaura a entrada/navegação anterior; nenhum dado precisa ser apagado. Não reescrever a história publicada.

## Validação e limites

Evidência automatizada deve ficar na PR desta entrega: unitários de projeção, typecheck, arquitetura, build/budget, matriz de navegadores e acessibilidade, além dos checks obrigatórios existentes. Os testes de UI usam transporte simulado isolado; não autorizam afirmar que login, leitura por PostgREST e escrita pela aplicação real já foram homologados. As permissões SELECT do papel authenticated foram consultadas no PRIMARY; concessão não comprova toda a jornada.

Aceite real pendente: login aprovado, abrir Mirassol x Internacional, conferir os 11 titulares e 12 reservas por equipe, escrever e salvar, recarregar, reabrir e editar o relato, verificar proteção do texto em erro e acesso aos registros anteriores. A fase autorizada segue desenvolvimento por commits; publicação não foi executada. CI, merge, sync e publicação são estados distintos.
