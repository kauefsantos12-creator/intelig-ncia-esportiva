# IE-00.01 — Identidade do projeto atual

**Data:** 11/10/2026 · **Fuso:** America/Sao_Paulo  
**Roadmap:** Inteligência Esportiva, versão 1.0, Framework EBSA 1.7  
**Estado:** AGUARDANDO INSUMO — verificação executada, fechamento condicionado à URL atual.

## Resultado e evidências

| Item | Identidade observada | Evidência e limite |
| --- | --- | --- |
| Repositório | kauefsantos12-creator/intelig-ncia-esportiva | GitHub conectado; branch padrão main |
| Baseline consultada | 4696c8eb400a088b226dce0653eb775b64383490 | HEAD de main na consulta; commit de 05/10/2026 |
| Projeto Lovable | 428fa571-e363-4bbf-ab2c-058451eba7dc | Descoberto no workspace atual; nome Inteligência Esportiva |
| Workspace | a6f6ab0ce77b5538cbf7 | Workspace Kauê Pastrello, acesso owner |
| Sincronização observada | Mesmo SHA da baseline no latest_commit_sha do Lovable | Confirma correspondência do código nessa consulta; não identifica o commit servido em produção |
| Editor | https://lovable.dev/projects/428fa571-e363-4bbf-ab2c-058451eba7dc | URL retornada pelo projeto conectado |
| Preview | https://id-preview--428fa571-e363-4bbf-ab2c-058451eba7dc.lovable.app | URL retornada pelo projeto; GET sem sessão respondeu HTTP 401 |
| Banco PRIMARY configurado | hefuvmocohhpmnhwpkac | PROJECT_STATE, supabase/config.toml e URL pública do cliente convergem; os dois arquivos de configuração também foram lidos no Lovable, na mesma baseline |
| Conexão de banco do projeto | Habilitada, stack supabase; SELECT respondeu | Consulta no projeto atual encontrou sports_fixtures e sports_match_reviews às 21:24:34 de Brasília; não houve escrita |
| Última URL de produção registrada | https://value-bet-engine.lovable.app | PROJECT_STATE e registro anterior de publicação de 05/10; GET atual respondeu HTTP 404 com página Project not found |
| URL atualmente usada por Kauê | Não confirmada | Não foi encontrado outro endereço confirmado nas fontes consultadas; o projeto informa is_published=true, sem devolver published_url |

O retorno `current_database() = postgres` é um nome genérico, não um identificador independente do projeto. `current_setting('app.settings.supabase_url', true)` retornou NULL. O ref do PRIMARY é sustentado pela configuração e pela conexão do projeto, sem inferir seu valor desses dois resultados SQL.

`.lovable/project.json` contém informações do template TanStack; não contém o ID do projeto conectado. A descrição automática do projeto Lovable ainda menciona apostas. Ela é metadado desatualizado e não autoriza reativar esse fluxo, encerrado no produto vigente.

## Divergências corrigidas

O README apresentava o repositório quant-football-insights, projeto Lovable 28664075-8af4-4155-9ee9-8ed86021681a, workspace IgC7Z3MS5vlDXWjvizgE e domínio anterior como identidade canônica. A tabela foi corrigida com os identificadores observados. Esses identificadores antigos permanecem classificados como histórico anterior ao remix de 01/10/2026.

PROJECT_STATE passa a distinguir o último endereço registrado do endereço atualmente validado. Registros antigos de 116/116 elencos, jobs, Elo e migrations mantêm suas datas e não foram promovidos a medições atuais. A revisão integral do histórico continua no escopo da IE-00.02.

## Pendência para fechamento

Identificar a URL atualmente usada por Kauê e conferir a aplicação servida nesse endereço contra o projeto e o PRIMARY registrados acima. Se value-bet-engine.lovable.app continuar sendo o endereço pretendido, a indisponibilidade de publicação precisa ser resolvida antes de concluir a ação. Um HTTP 404 isolado não informa a causa nem autoriza escolher outro domínio.

A ação não está CONCLUÍDA e não libera sua dependência IE-00.02. O capítulo IE-00 e os gates EBSA permanecem abertos.

## Validação, impacto e rollback

Validação executada: leitura do GitHub e do projeto conectado; comparação dos SHAs e configurações; SELECT no banco; GET da URL registrada e do preview. Revisão documental de consistência e links locais. A publicação, o login, as jornadas, a cobertura esportiva e a recuperação não foram homologados.

Alteração restrita à identidade documental e ao checkpoint do roadmap. Sem mudança de código de aplicação, schema, permissões, métricas, provedores ou dados pessoais. Nenhuma mensagem ao agente Lovable, migration, carga de dados ou deploy foi disparada.

Rollback documental: reverter o commit desta alteração, preservando a evidência datada no histórico Git. Para retomar, conferir o HEAD atual, obter o endereço real e acrescentar a evidência de runtime antes de mudar o estado da ação.
