# Privacidade e tratamento de dados pessoais

Versão operacional: 15/09/2026.

Este documento é a fonte técnica canônica do Aviso de Privacidade exibido em `/privacidade`. O projeto continua sendo um ambiente privado, single-user e single-maintainer. Antes de disponibilização a terceiros, a identidade formal do controlador, canal externo para titulares, contratos/DPA e transferências internacionais devem ser revistos.

## Princípios aplicados

- finalidade e necessidade: coletar apenas o necessário para autenticação, segurança e funcionamento do Motor de Inteligência Esportiva;
- transparência: aviso público disponível antes do login;
- minimização: OAuth solicita apenas os dados necessários à autenticação Google; nome/avatar/picture são removidos do metadata persistido;
- segurança: ownership, RLS, sessão absoluta de 30 dias e telemetria sanitizada;
- retenção limitada: sessões 30 dias, push inativo 90 dias, governança 365 dias;
- exclusão: fluxo self-service em `/conta`, além de cleanup defensivo quando o usuário de autenticação é removido administrativamente.

## Autenticação Google

O login Google é iniciado pelo **broker OAuth gerenciado pelo Lovable**. As credenciais OAuth do Google não ficam embutidas no cliente da aplicação. Após a conclusão do fluxo gerenciado, os tokens retornados são usados para estabelecer a sessão de autenticação no **Lovable Cloud**.

A allowlist do usuário aprovado, a validação server-side e o prazo absoluto de sessão de 30 dias continuam preservados no reescopo para inteligência esportiva.

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
| Anotações e notas pessoais de partidas | enquanto a conta estiver ativa |
| Dados esportivos compartilhados | conforme necessidade operacional do produto e políticas de fonte/cache |
| Governance change log | 365 dias |
| Identity/Auth | enquanto a conta estiver ativa |

`public.run_privacy_retention_cleanup()` executa diariamente via `pg_cron`. A exclusão de conta remove imediatamente os dados pessoais de aplicação vinculados. No novo escopo, `erase_user_application_data(user_id)` remove as Anotações/notas pessoais do usuário e suas assinaturas Web Push; os dados esportivos compartilhados não são dados pessoais do titular e permanecem no catálogo esportivo. O histórico de governança segue retenção limitada de 365 dias como evidência de segurança/accountability.

## Direitos e controles

A área `/conta` permite:

1. abrir o Aviso de Privacidade;
2. desativar notificações e apagar as assinaturas Web Push do servidor;
3. excluir definitivamente conta e dados pessoais, mediante confirmação textual explícita.

A exclusão chama primeiro `erase_user_application_data(user_id)` e em seguida remove o usuário do serviço de autenticação. Um trigger `cleanup_deleted_app_user` repete a limpeza de forma idempotente quando um usuário é apagado diretamente no Auth.

## Telemetria

Antes de qualquer envio aos hooks de runtime, `lovable-error-reporting.ts` remove email, tokens Bearer/JWT, endpoints Web Push, UUIDs e campos cujo nome indica segredo, autenticação ou identificador sensível. O banco da aplicação não mantém uma cópia própria dessa telemetria.

## Reescopo de 15/09/2026

A retirada do motor de apostas elimina do domínio ativo dados de banca, stake, CLV, odds, decisões e histórico pessoal de apostas. O novo domínio pessoal é restrito principalmente a autenticação, Web Push e à aba **Anotações**: indicação de jogo assistido/não assistido, comentário opcional e notas pessoais de jogadores.

A migration de reconciliação de runtime atualiza `erase_user_application_data` para não depender das tabelas removidas do produto anterior. As notas dos jogadores são apagadas por cascade quando a Anotação correspondente é removida.

## Pontos externos que continuam sujeitos a evidência do fornecedor

- localização física/região final de processamento do Lovable Cloud;
- termos/DPA e mecanismos de transferência internacional;
- retenção interna de infraestrutura dos provedores além dos registros controlados pela aplicação.

Esses itens não devem ser presumidos como conformes em uma futura oferta a terceiros; exigem revisão contratual antes de comercialização.
