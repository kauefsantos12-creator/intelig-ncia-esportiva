# IE-00.05 — Decisões parciais do PROJECT_PROFILE

Estado: **EM EXECUÇÃO — RASCUNHO**, 16/10/2026, America/Sao_Paulo. Base Git: `70f37dd21dc481528766762fbba69f08a8f0cea2`; dados vivos preservam a data da IE-00.04, 15/10. [Perfil YAML](PROJECT_PROFILE_DRAFT_v1_7.yaml) e [schema fornecido no EBSA 1.7](PROJECT_PROFILE.schema.json). A proposta não declara conclusão de IE-00.05 nem aprovação de gates.

## Decisões de Kauê

| Assunto | Decisão e data | Evidência da escolha |
| --- | --- | --- |
| Prioridade | Resenha diária, 15/10 | Resposta “Resenha”; IE-00.03, PR #21 |
| Perda de anotações — RPO | Até 60 minutos, 15/10 | Resposta “2” entre nenhuma perda, 1 hora e 24 horas |
| Tempo de recuperação — RTO | Até 60 minutos, 15/10 | Resposta “1” entre 1, 4 e 24 horas |
| Audiência da primeira versão | Somente Kauê, 16/10 | Resposta “1” entre somente ele, convidados e público geral |
| Responsáveis | Kauê nos seis papéis; assistência do ChatGPT na execução, 16/10 | Resposta “1” entre responsável único e outra pessoa também responsável |
| Lesões | Fora da primeira versão, 16/10 | Resposta “2” entre manter informações públicas e deixar fora |
| Base do Palmeiras | Jogos e resenhas, sem perfis nem estatísticas individuais, 16/10 | Resposta “1” entre somente jogos/resenhas e também perfis/estatísticas |
| Proteção inicial | Backups testados; avaliar réplica se necessária para RPO/RTO, 16/10 | Resposta “1” entre essa estratégia e réplica externa no planejamento inicial |

As respostas foram dadas nas perguntas sequenciais de execução do roadmap. Não autorizam reativação de apostas, novas fontes, descarte de dados, contratação ou publicação. Resenha → Hoje → Anotações continua composição candidata, a fechar no seu gate.

## Perfil e evidência

O YAML representa um **rascunho do projeto**, com contexto PROJECT. Os campos documentam a audiência pretendida e o desenho observado; evidência por campo explica seus limites. UNKNOWN nunca significa false ou N/A. A aplicação efetiva de controles precisa de prova própria.

- `project_type=internal_web_app`, `exposure=internal`: uso exclusivo pretendido, com autenticação; sem atestado de isolamento de rede ou autorização funcionando.
- Backend/PRIMARY Lovable Cloud comprovados na [baseline de 15/10](IE_00_04_SURFACE_BASELINE_2026-10-15.md). Nenhuma consulta de banco foi repetida nesta preparação.
- Interface, autenticação, integrações e regras de domínio têm evidência no código. Cliente administrativo em `src/integrations/supabase/client.server.ts` justifica `privileged_roles=true`, sem afirmar revisão completa dos privilégios vivos.
- Conta, comentários e avaliações pessoais justificam `personal_data=true`. Cobertura editorial da base pode identificar menores: manter `children_or_adolescents_data=true` para planejar controles e inventariar efetivamente os dados tratados.
- `service_class`, `criticality`, `data_residency_constraints`, `replica_enabled`, `sensitive_data`, `storage_files`, `public_api`, `payments_or_financial_impact` e `automated_decisioning` continuam UNKNOWN. A classificação detalhada e os controles correspondentes permanecem abertos.

## Adequações e provas antes da entrega

| Tema | Como verificar | Resultado esperado e estado |
| --- | --- | --- |
| Acesso exclusivo | Testar conta autorizada, outra conta e sessão sem login; validar ownership por recurso | Somente Kauê acessa a jornada pessoal; PENDENTE |
| Recuperação | Inventariar proteção, restaurar cópia isolada, medir lacuna dos registros e tempo até retomada de uso | RPO ≤ 60 min e RTO ≤ 60 min; NÃO VERIFICADO. Backup disponível ou viável ainda não comprovado |
| Réplica | Inventariar configuração operacional; reavaliar desenho se o ensaio de backup não cumprir algum limite | Sem réplica externa aprovada no plano inicial; estado operacional UNKNOWN. A estratégia não dispensa controles de réplica se ela for encontrada ou ativada |
| Lesões | Desativar chamada/gravação do caminho `/injuries`/`sports_injuries`; revisar leituras, contexto editorial e reprocessamento; testar demais coletas | Primeira versão sem coleta ou uso de lesões; implementação PENDENTE. Dados existentes não foram inventariados ou apagados |
| Base do Palmeiras | Revisar seleção de equipes e caminhos de elenco, enriquecimento e Analytics; testar jogos da base e profissionais | Jogos/resenhas sem perfis ou estatísticas individuais dessa base; implementação PENDENTE. Nomes editoriais ainda exigem classificação |
| Arquivos/APIs/decisões automatizadas | Inventariar objetos, superfícies expostas, privilégios e usos automatizados | Evidência para os campos UNKNOWN, sem inferir ausência pelo silêncio do código |

RPO/RTO ficam neste registro, pois não são propriedades do schema de perfil 1.7. Se INTERNO for aprovado, seus padrões candidatos de RTO 240 min e RPO 1.440 min precisarão ser conciliados com as metas escolhidas, com ADR/evidência conforme o controle aplicável. `control_overrides=[]` não aprova exceção nem dispensa controles; ainda não há override formal. SLO e periodicidade de ensaio continuam pendentes.

## Papéis confirmados

Kauê: business, technical, data, operations, security e privacy. O ChatGPT presta assistência na execução autorizada. A responsabilidade nominal única não altera os gates de PR, CI, preservação do histórico e evidência. Não exigir segundo mantenedor inexistente.

## Estado da preparação

Esta proposta só acrescenta documentação e perfil em rascunho. Nenhuma alteração de código funcional, schema, configuração, permissão, coletor, fila, backup/restore ou dado persistido. Sem mensagem ao Lovable ou publicação. CI e integração devem ser registrados na PR; esta preparação ainda não é vigência na main. A IE-00.05 só poderá ser concluída após resolver os campos materiais, confirmar o perfil e cumprir seu critério de saída.

## Validação desta proposta

Validador original `ferramentas/validar_framework.py` do pacote EBSA 1.7 executado localmente com `--profile` (sem `--ready`): `framework_errors=[]`, `profile_errors=[]`, status PASS no contrato de rascunho. Schema copiado byte a byte do pacote fornecido. Links relativos e presença dos nove campos UNKNOWN conferidos. Esse PASS não aprova perfil confirmado, gates, runtime ou recuperação. Não foram adicionados testes que espelhem documentação; CI remoto permanece para a PR.
