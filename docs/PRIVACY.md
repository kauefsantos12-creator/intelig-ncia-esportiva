# Privacidade e tratamento de dados pessoais

Versão operacional: 16/09/2026.

Este documento é a fonte técnica canônica do Aviso de Privacidade exibido em `/privacidade`. O projeto continua sendo um ambiente privado, single-user e single-maintainer. Antes de disponibilização a terceiros, a identidade formal do controlador, canal externo para titulares, contratos/DPA e transferências internacionais devem ser revistos.

## Princípios aplicados

- finalidade e necessidade: coletar apenas o necessário para autenticação, segurança e funcionamento do Meus Jogos;
- transparência: aviso público disponível antes do login;
- minimização: OAuth solicita apenas os dados necessários à autenticação Google; nome/avatar/picture são removidos do metadata persistido;
- segurança: ownership, RLS, sessão absoluta de 30 dias e telemetria sanitizada;
- retenção limitada: sessões 30 dias, push inativo 90 dias, governança 365 dias;
- exclusão: fluxo self-service em `/conta`, além de cleanup defensivo quando o usuário de autenticação é removido administrativamente.

## Autenticação Google

O login Google é iniciado pelo **broker OAuth gerenciado pelo Lovable**. As credenciais OAuth do Google não ficam embutidas no cliente da aplicação. Após a conclusão do fluxo gerenciado, os tokens retornados são usados para estabelecer a sessão de autenticação no **Lovable Cloud**.

A allowlist do usuário aprovado, a validação server-side e o prazo absoluto de sessão de 30 dias permanecem obrigatórios para o Meus Jogos.

A tela de autenticação apresenta apenas a identidade atual do produto e as superfícies esportivas disponíveis ao usuário autorizado. Essa camada visual não altera o broker OAuth, provider Google obrigatório, allowlist, política de sessão, validação server-side ou o acesso público ao Aviso de Privacidade.

## Compartilhamento

- Google: autenticação OAuth;
- Lovable e Lovable Cloud: broker OAuth gerenciado, autenticação, banco e backend;
- Apple Push Service, Google FCM ou Mozilla Push: somente se Web Push estiver ativo no respectivo dispositivo;
- provedores esportivos, como 5Dollar e API-Football: recebem parâmetros de partidas/equipes necessários às consultas esportivas, não identificadores pessoais da conta por desenho da aplicação;
- fontes de transmissão: dados públicos de programação são normalizados sem envio de dados pessoais do usuário.

## Retenção

| Categoria | Retenção operacional |
|---|---|
| Sessões Auth | 30 dias |
| Web Push inativo | 90 dias sem atualização |
| Anotações, relatos pessoais e notas de partidas | enquanto a conta estiver ativa |
| Dados esportivos compartilhados | conforme necessidade operacional do produto e políticas de fonte/cache |
| Governance change log | 365 dias |
| Identity/Auth | enquanto a conta estiver ativa |

`public.run_privacy_retention_cleanup()` executa diariamente via `pg_cron`. A exclusão de conta remove imediatamente os dados pessoais de aplicação vinculados. `erase_user_application_data(user_id)` remove as Anotações, relatos pessoais/notas do usuário e suas assinaturas Web Push; os dados esportivos compartilhados não são dados pessoais do titular e permanecem no catálogo esportivo. O histórico de governança segue retenção limitada de 365 dias como evidência de segurança/accountability.

## Direitos e controles

A área `/conta` permite:

1. abrir o Aviso de Privacidade;
2. desativar notificações e apagar as assinaturas Web Push do servidor;
3. excluir definitivamente conta e dados pessoais, mediante confirmação textual explícita.

A exclusão chama primeiro `erase_user_application_data(user_id)` e em seguida remove o usuário do serviço de autenticação. Um trigger `cleanup_deleted_app_user` repete a limpeza de forma idempotente quando um usuário é apagado diretamente no Auth.

## Telemetria

Antes de qualquer envio aos hooks de runtime, `lovable-error-reporting.ts` remove email, tokens Bearer/JWT, endpoints Web Push, UUIDs e campos cujo nome indica segredo, autenticação ou identificador sensível. O banco da aplicação não mantém uma cópia própria dessa telemetria.

## Domínio pessoal atual

O domínio pessoal inclui autenticação, Web Push, **Meus Jogos** (relatos privados antes, durante ou depois da partida) e o histórico de **Anotações**: indicação de jogo assistido/não assistido, comentário opcional e notas pessoais de jogadores. A mudança de entrada em 16/10/2026 reutiliza o armazenamento privado existente e mantém ownership, RLS e controles de exclusão.

As notas dos jogadores são apagadas por cascade quando a Anotação correspondente é removida. Dados esportivos compartilhados, ratings Elo, fixtures, estatísticas e informações de transmissão pertencem ao catálogo esportivo e não identificam o titular por desenho da aplicação.

## Pontos externos que continuam sujeitos a evidência do fornecedor

- localização física/região final de processamento do Lovable Cloud;
- termos/DPA e mecanismos de transferência internacional;
- retenção interna de infraestrutura dos provedores além dos registros controlados pela aplicação.

Esses itens não devem ser presumidos como conformes em uma futura oferta a terceiros; exigem revisão contratual antes de comercialização.

## Relatos pessoais antes e durante o jogo

A área Anotações permite informar uma partida e guardar um relato na própria conta mesmo quando a agenda não estiver disponível. Times, competição e horário informados pelo usuário não se tornam dados oficiais nem alimentam Elo ou Analytics. Somente a conta Google aprovada acessa seus relatos. Eles são mantidos em `sports_personal_match_reports`, com controle de versão para detectar gravações concorrentes, e incluídos na exclusão da aplicação e da conta. Este fluxo não envia o texto para IA ou provedores esportivos, nem o persiste no armazenamento do navegador. Use Salvar relato; confirmação visual só ocorre após resposta do banco. Sem confirmação, mantenha o formulário aberto e tente novamente.

## Apresentação em página única — 16/10/2026

O rebranding não altera autenticação, allowlist, prazo de sessão, RPCs, RLS, retenção ou exclusão. Os controles existentes foram movidos para `AccountPrivacyPanel`, em `/#conta`; `/conta` redireciona a essa seção. O aviso é compartilhado entre `/#privacidade` e a rota pública `/privacidade`, que permanece disponível antes do login. Seções são recolhíveis sem desmontar seu conteúdo após a primeira abertura. Nenhum texto do relato é enviado a fonte esportiva ou incluído em telemetria por esta mudança.

## Avaliações no campinho — 16/10/2026

Usa os mesmos registros pessoais de reviews/notas, sem tabela ou finalidade nova. A confirmação de participação é uma declaração do usuário sobre o que viu; não é estatística do provedor. Aplicam-se ownership/RLS, retenção e exclusão por cascade existentes. Não enviar nota ou observação pessoal às fontes esportivas. Nova RPC usa a sessão, sem credenciais privilegiadas. A apresentação esquemática não salva localização observada nem rastreamento. Ativação da migration no PRIMARY permanece pendente de autorização explícita.
