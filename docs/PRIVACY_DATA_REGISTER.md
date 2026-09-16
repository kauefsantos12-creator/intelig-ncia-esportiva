# Registro de operações de tratamento de dados pessoais

Última revisão: 15/09/2026.

A fonte executável correspondente é `public.privacy_processing_activities` no Lovable Cloud. Este registro descreve o escopo pessoal do Motor de Inteligência Esportiva após a retirada das funcionalidades de apostas.

| Atividade | Dados | Finalidade | Justificativa operacional | Compartilhamento | Retenção | Exclusão |
|---|---|---|---|---|---|---|
| Google identity | UUID, email, provider IDs | autenticação e autorização | funcionalidade solicitada + segurança | Google; Lovable/Lovable Cloud | vida da conta | exclusão do usuário Auth |
| Auth session | session id, IP, user-agent, timestamps | validar requisições e impedir acesso indevido | segurança/prevenção a fraude | Lovable/Lovable Cloud | 30 dias | cleanup diário / exclusão da conta |
| Ownership | UUID nas superfícies pessoais | associar Anotações e controles ao titular correto | execução do serviço | Lovable Cloud | vida da conta | account erasure |
| Web Push | endpoint, p256dh, auth, user-agent | notificações opcionais do sistema | recurso opcional solicitado | Apple/FCM/Mozilla | até desativação/invalidação ou 90 dias inativo | self-service + cleanup |
| Anotações de partidas | watched/não watched, comentário opcional, fixture ID | diário pessoal dos jogos acompanhados | funcionalidade solicitada | Lovable Cloud | vida da conta | account erasure |
| Notas pessoais de jogadores | player ID, nota pessoal 0–10 em passos de 0,5 | histórico pessoal de avaliação de atuações | funcionalidade solicitada | Lovable Cloud | vida da conta | cascade da Anotação/conta |
| Error telemetry | rota/erro/stack sanitizados | diagnóstico | segurança e confiabilidade | runtime Lovable quando disponível | sem identificadores pessoais crus intencionais | redaction antes do envio |
| Governance audit | actor UUID, before/after, timestamp | accountability e investigação | segurança/auditoria | Lovable Cloud | 365 dias | cleanup controlado |

Os dados compartilhados de partidas, competições, clubes, jogadores, estatísticas, Elo e programação de transmissão são dados esportivos do produto e não são classificados neste registro como dados pessoais do titular da conta.

## Regras de minimização

- nome, full_name, avatar_url e picture não são necessários para autorização e são removidos do metadata persistido;
- o OAuth solicita somente `openid email`;
- o novo backend não mantém CSV/upload como fluxo operacional;
- provedores esportivos não recebem o UUID/email do usuário para consultas esportivas;
- telemetria nunca deve receber Authorization, cookie, JWT, email, endpoint Web Push ou UUID cru;
- uma partida marcada como não assistida mantém avaliações de jogadores como `NULL` e não exige comentário.

## Exclusão e reescopo

`erase_user_application_data(user_id)` remove assinaturas Web Push e `sports_match_reviews` pertencentes ao usuário. As notas em `sports_player_personal_ratings` são removidas por relacionamento cascade com a Anotação correspondente. Tabelas antigas de banca, odds, apostas, runs/drafts e modelos deixam de integrar o domínio ativo e não são dependências do fluxo de exclusão após o backend reset.

## Mudanças futuras

Qualquer nova coluna ou integração que possa conter dado pessoal deve atualizar este registro e `docs/PRIVACY.md` no mesmo PR. O CI considera autenticação, privacidade, telemetria e migrations de privacidade como mudanças governadas.
