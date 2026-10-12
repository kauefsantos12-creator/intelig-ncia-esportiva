# IE-00.01 — Identidade do projeto atual

**Data:** 11/10/2026 · **Fuso:** America/Sao_Paulo  
**Roadmap:** Inteligência Esportiva, versão 1.0, Framework EBSA 1.7  
**Estado:** CONCLUÍDO — identidade da fase de desenvolvimento por commits, conforme esclarecimento de Kauê em 11/10/2026. Integração deste registro condicionada ao CI da PR #19.

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
| Endereço público nesta fase | NÃO SE APLICA | Kauê confirmou que não há endereço; a execução é por commits no repositório informado. Os metadados Lovable não substituem essa definição de fase |

O retorno `current_database() = postgres` é um nome genérico, não um identificador independente do projeto. `current_setting('app.settings.supabase_url', true)` retornou NULL. O ref do PRIMARY é sustentado pela configuração e pela conexão do projeto, sem inferir seu valor desses dois resultados SQL.

`.lovable/project.json` contém informações do template TanStack; não contém o ID do projeto conectado. A descrição automática do projeto Lovable ainda menciona apostas. Ela é metadado desatualizado e não autoriza reativar esse fluxo, encerrado no produto vigente.

## Divergências corrigidas

O README apresentava o repositório quant-football-insights, projeto Lovable 28664075-8af4-4155-9ee9-8ed86021681a, workspace IgC7Z3MS5vlDXWjvizgE e domínio anterior como identidade canônica. A tabela foi corrigida com os identificadores observados. Esses identificadores antigos permanecem classificados como histórico anterior ao remix de 01/10/2026.

PROJECT_STATE passa a distinguir o último endereço registrado do endereço atualmente validado. Registros antigos de 116/116 elencos, jobs, Elo e migrations mantêm suas datas e não foram promovidos a medições atuais. A revisão integral do histórico continua no escopo da IE-00.02.

## Definição de fase e fechamento

Após a primeira verificação, Kauê esclareceu: não há endereço de publicação; o trabalho deve seguir o roadmap por commits em kauefsantos12-creator/intelig-ncia-esportiva. O requisito de URL foi resolvido pela confirmação explícita de sua ausência nesta fase. O endereço antigo e o preview acima são evidências históricas/metadados técnicos, não uma publicação atual que precise ser recuperada para encerrar a identidade.

A IE-00.01 está concluída no escopo de repositório, branch, baseline, projeto conectado e PRIMARY configurado, com conectividade verificada. A próxima ação é IE-00.02. O capítulo IE-00 e seus gates permanecem abertos; publicação, login e homologação de jornadas não foram realizados nem dispensados.

O [roadmap completo](../roadmap/INTELIGENCIA_ESPORTIVA_ROADMAP_EBSA_v1_7.md) passa a estar versionado no próprio repositório esportivo. A proposta anterior de atualizar a agenda (PR #9 de kauefsantos12-creator/agenda) foi encerrada sem merge, pois sua pendência de URL não se aplica à definição vigente.

## Correção do CI necessária para integração

O audit do primeiro commit da PR #19 identificou quatro avisos: duas vulnerabilidades critical e duas high. A cópia aninhada de seroval 1.5.6 foi atualizada para 1.6.8, que já existia no nível principal; shell-quote foi atualizada de 1.10.0 para 1.11.0; source-map-js, de 1.2.1 para 1.2.2. Overrides exatos e lockfile mantêm a resolução reproduzível. A regeneração também consolidou cópias de router-generator na versão 1.167.40 já presente no grafo original. Nenhuma dependência direta de framework, banco ou regra esportiva foi alterada para contornar os checks.

As três versões corretivas constam no npm com publicação em setembro de 2026. Foi mantida a guarda minimumReleaseAge=86400 e sua lista de exceções existente. A candidata só pode ser integrada após audit e todos os checks obrigatórios aprovados.

Referências das correções: [Seroval — chamada indevida](https://github.com/advisories/GHSA-p6vx-979v-rg4c), [Seroval — memória](https://github.com/advisories/GHSA-jp82-f5mq-hwhp), [shell-quote](https://github.com/advisories/GHSA-pqg4-j6r4-53mv), [source-map-js](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).

## Validação, impacto e rollback

Validação executada: leitura do GitHub e do projeto conectado; comparação dos SHAs e configurações; SELECT no banco; GET da URL registrada e do preview. Revisão documental de consistência e links locais; 104 ações de origem preservadas, com uma única conclusão. Após a atualização de dependências: audit sem vulnerabilidade high/critical (um aviso abaixo desse nível), check estático/tipagem/arquitetura aprovado e 218 testes em 49 arquivos aprovados. Build e instalação com frozen-lockfile aprovados; gates remotos acompanham a PR #19. A publicação, o login, as jornadas, a cobertura esportiva e a recuperação não foram homologados.

Alteração de identidade documental, inclusão do roadmap e atualização corretiva de dependências transitivas para passar o CI. Sem mudança de código de aplicação, schema, permissões, métricas, provedores ou dados pessoais. Nenhuma mensagem ao agente Lovable, migration, carga de dados ou deploy foi disparada.

Rollback: reverter os commits desta alteração, preservando as evidências no histórico Git. Reverter as dependências reintroduz os avisos de vulnerabilidade e deve ser tratado explicitamente. Para retomar o trabalho, conferir o HEAD atual e executar IE-00.02; não pedir endereço enquanto a fase continuar sendo desenvolvimento por commits.
