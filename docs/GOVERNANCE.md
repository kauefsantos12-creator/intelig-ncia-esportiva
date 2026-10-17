# Governança — Meus Jogos

> Revisão documental: 15/10/2026, IE-00.02. Referência: main `868c13ac99c92bfdf202c6ace64f3ebe85e5b1b1`.
> Medições e auditorias anteriores conservam sua data e seu ambiente.

## Escopo e autoridade

O nome e o foco vigente em 16/10/2026 são **Meus Jogos**, em uma única página de produto, com conta/privacidade e histórico preservados em seções internas. Acesso público ao aviso antes do login mantido. [Rebranding e aliases](governance/MEUS_JOGOS_REBRAND_2026-10-16.md). A evolução de Noticiário/Resenha, Hoje separado, Elo e Analytics fica pausada, sem desativar crons ou automações externas. A decisão substitui a prioridade de 15/10; ver [escopo e aceite](governance/MEUS_JOGOS_SCOPE_2026-10-16.md). Apostas, odds, banca, picks e execução financeira pertencem ao produto descomissionado. Sua presença em código, tabelas ou documentos não autoriza reativação.

- **GitHub main:** código, migrations, testes, contratos e documentação versionada.
- **Lovable Cloud:** dados e operação vivos; PRIMARY configurado `hefuvmocohhpmnhwpkac`.
- **Lovable conectado:** projeto `428fa571-e363-4bbf-ab2c-058451eba7dc`, registrado na IE-00.01. Não criar ou remixar projeto paralelo.
- **Fase atual:** desenvolvimento por commits, sem endereço público, conforme decisão de Kauê em 11/10/2026. Publicação é verificada na entrega correspondente.

Código demonstra implementação; teste/consulta do ambiente demonstra execução. Documento histórico não prevalece sobre o escopo atual nem comprova o ambiente vivo. Consultar [PROJECT_STATE](PROJECT_STATE.md) e [histórico](history/README.md).

## Domínios e responsabilidades

Kauê decide o produto. Os papéis abaixo representam responsabilidades; a atribuição nominal completa e o perfil formal permanecem em IE-00.05.

| Domínio | Papel de decisão | Responsável técnico | Regra de mudança |
| --- | --- | --- | --- |
| Fontes/ingestão | Product/Data Owner | Repository Maintainer | PR + CI + contrato, catálogo, quota e proveniência |
| Editorial/transmissão | Product/Data Owner | Repository Maintainer | Fontes aprovadas, evidência e confirmação nominal quando exigida |
| Elo/métricas esportivas | Quantitative Model Owner | Repository Maintainer | Semântica versionada, regressões e evidência temporal/OOS quando aplicável |
| Analytics | Product/Data Owner | Repository Maintainer | Versão, amostra, temporada e reconciliação |
| Anotações/memória pessoal | Product/Data Owner | Repository Maintainer | Ownership, preservação, exportação e recuperação |
| Segurança/acessos | System Owner | Repository Maintainer | Revisão trimestral e prova no alvo correto |
| Schema | Data/System Owner | Repository Maintainer | Migration + testes de banco; executor e destino conhecidos |
| Desempenho/capacidade | System Owner | Repository Maintainer | Budget + medição + rollback |

Enquanto houver um mantenedor, `CODEOWNERS` aponta para ele; não exigir uma segunda pessoa inexistente. Quando outro responsável existir, ajustar o ruleset para exigir revisão aplicável. CI existente não comprova proteção técnica da main: IE-01.07/IE-09.01 permanecem responsáveis por essa verificação.

## Mudança, evidência e rollback

Toda mudança relevante entra por branch e PR com problema, comportamento final, impacto, validação e rollback. Todos os gates obrigatórios devem estar verdes antes do merge, inclusive migrations/pgTAP. Preservar história publicada; rollback usa novo commit de reversão.

Registrar commit, ambiente, data e método da prova. Distinguir `PASS`, `FAIL`, `UNVERIFIED` e `N/A` justificado. Contagens precisam de data, origem, escopo e numerador/denominador. Consulta sem erro não comprova completude.

`implementado ≠ testado ≠ mergeado ≠ sincronizado ≠ publicado ≠ validado em produção`.

A conclusão documental não fecha validação de dados, acesso ou recuperação. Após merge registrar integração; confirmar sincronização/publicação quando fizerem parte da entrega.

## Fontes e semântica

- Definições: `docs/METRICS_GLOSSARY.md` e `public.metric_definitions`. Mudança semântica cria versão; nunca reescrever significado histórico.
- Linhagem: `public.source_definitions` e `docs/DATA_CATALOG.md`; observações/fetches usam `source + definition_version` registrado.
- Comportamento quantitativo novo exige testes e evidência point-in-time/OOS quando aplicável. Distinguir Elo local, liga e fotografia global.
- Editorial: `editorial-explanatory-v3`, três eixos aprovados e 14 veículos em `editorial-policy.ts`. Números de desempenho da resenha vêm apenas do SofaScore; ausência implica omissão.
- Transmissão: FutNaTV para descoberta → mapa de direitos → confirmação nominal oficial. O fallback `futebol.tv.br` existe no código; sua política permanece pendente. Não ampliar fontes automaticamente.
- Agenda/resenha, Elo e coleta individual têm contratos próprios. Cobertura de um fluxo não prova cobertura dos demais.

Esta revisão não muda catálogo ou contratos em runtime nem substitui a homologação de IE-LP1.

## Acesso, privacidade e integridade

Autenticação, autorização por recurso e acesso administrativo são verificações distintas. Credenciais privilegiadas ficam no servidor; ownership, RLS, grants, views e RPCs precisam de prova no ambiente alvo.

Revisão mínima trimestral de aplicação, GitHub e Lovable. Evidência externa indisponível permanece `REVIEW_REQUIRED`; nova tentativa em até 30 dias.

O desenho versionado mantém `governance_change_log` append-only, com before/after, papel de banco, usuário disponível e timestamp, e releases em `app_schema_releases`. Efetividade no Cloud atual não foi revalidada nesta ação. Não editar silenciosamente histórico operacional nem `supabase_migrations.schema_migrations`.

Comentários, avaliações e campinho não herdam descarte de observações técnicas. Retenção, exportação e backup/restore próprios permanecem em IE-00.06/IE-01.05, preservando a memória esportiva.

## Integrações, interface e qualidade

- Cache, quota compartilhada, retries limitados, leases e heartbeat fazem parte do desenho recuperável. Dispatch HTTP não equivale a execução concluída.
- Código não transfere automaticamente configuração de cron, segredos ou permissões. Comprovar cada operação no alvo correto.
- Usar `America/Sao_Paulo`; distinguir edição, kickoff, coleta e corte Elo.
- Distinguir vazio real, falha, parcialidade e desatualização; falha não pode aparecer como ausência de jogos.
- A UI não cria uma segunda fonte de verdade para dados persistidos. Infraestrutura fica no diagnóstico, salvo quando ajuda uma decisão do usuário.
- Preservar testes de navegação/UX, fronteiras de código, orçamento de bundle, smoke de concorrência e matriz de navegadores/acessibilidade. Ajuste de budget exige justificativa explícita; não relaxar gates para obter aprovação.

## Retenção técnica, cadência e histórico

As políticas históricas de `raw_observations` (90 dias), `source_fetches`/`pipeline_logs` (180 dias), Web Vitals (30 dias) e precedência de `analysis_jobs` estão preservadas no [snapshot de governança](history/ie-00-02-2026-10-15/GOVERNANCE.md). Esta revisão não altera prazos nem desativa controles. Aplicação efetiva ao Cloud atual exige inventário; não estender regras a dados pessoais ou jobs novos por analogia.

Fontes, modelos, Elo, Analytics e schema: revisão a cada 90 dias ou mudança material. Custos, capacidade, backup e objetivos de serviço dependem do perfil aprovado e da comprovação de IE-00/IE-01.

O [índice histórico](history/README.md) preserva documentos e medições anteriores. Jornada de upload/odds, três picks e métricas financeiras não governam a navegação atual. Os controles gerais reaproveitados estão explicitados acima; regras quantitativas preservadas no legado continuam vinculadas à sua versão histórica.
