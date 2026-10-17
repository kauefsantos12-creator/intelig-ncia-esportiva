# Meus Jogos — rebranding e página única

Pedido de Kauê em 16/10/2026, America/Sao_Paulo: “realize um rebranding da aplicação e uma única página com meus jogos”. Base: main `364003a29b5aa35a6938c6303ddaa3d0cd6e4387`. A reformulação concretiza o foco pessoal já aprovado e não encerra ações do roadmap.

## Motivo, execução e resultado esperado

A aplicação ainda apresentava a marca ampla e páginas separadas após a redução do escopo. A reformulação adota **Meus Jogos** como nome e um caderno de futebol como direção visual: verde de tinta, papel claro, título editorial e símbolo de campo/caderno com marcador. Entrada, login, metadados, manifesto, ícones e identidade de notificação ficam consistentes.

A página única reúne partida, titulares/reservas e relatos. No computador, partida e escalação ficam lado a lado; no celular, em sequência. O resultado esperado é acompanhar e escrever sem precisar alternar páginas. Acesso à conta e à memória anterior continua disponível em seções recolhíveis que só montam na primeira abertura e não desmontam ao recolher, preservando estado. A barra inferior redundante foi removida; o editor fica livre dela quando o teclado abre.

## Rotas e preservação

| Endereço | Comportamento |
| --- | --- |
| `/` | Única página de produto: partidas, escalação, caderno e seções internas |
| `/anotacoes` | Redirect para `/#historico`; reviews, notas e campinho preservados em LegacyNotesPanel |
| `/conta` | Redirect para `/#conta`; mesmos controles de notificações/exclusão |
| `/hoje`, `/elo`, `/analytics` | Redirect para `/`; evolução pausada, código e dados preservados |
| `/privacidade` | Aviso público antes do login, compartilhado com a seção interna |

A rota pública do aviso é suporte à privacidade, não uma segunda página de produto. Endpoints de servidor/worker, OAuth, middleware, allowlist, sessão, RPCs e RLS permanecem iguais. Nenhum schema, DML, dado esportivo, nota, fonte, quota, job, cron ou automação externa foi alterado. O projeto Lovable e o repositório canônicos são os mesmos; nomes técnicos legados não são rotas ativas do produto.

## Validação e limites

Checks obrigatórios devem passar no head da PR antes de integrar. Unitários existentes foram ajustados para verificar as fronteiras e componentes extraídos, mantendo os contratos de memória pessoal, acessibilidade e privacidade. A matriz de navegador verifica marca/login, redirects antigos, estado do caderno e arquivo ao recolher/abrir, leitura de escalação, salvar/reabrir com transporte simulado e axe nas superfícies aplicáveis. Gates não foram reduzidos; a remoção do observador de teclado corresponde à remoção da barra inferior que ele ocultava.

O fixture de navegador utiliza o layout e os componentes de produção com transporte de relatos simulado. Não cria bypass de autenticação na aplicação. Execução automatizada não comprova login real de Kauê, salvamento na UI de produção, publicação ou atualização de atalho instalado. A fase por commits é mantida; sem deploy e sem mensagem ao Lovable. Integração, checks e sincronização ficam registrados na PR.

Rollback por novo commit de reversão, restaurando apresentação e aliases, sem apagar dados e sem reescrever histórico. Perfil IE-00.05 e homologação/recuperação continuam pendentes.
