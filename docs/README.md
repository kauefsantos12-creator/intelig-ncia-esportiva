# Documentação do Motor de Inteligência Esportiva

Este diretório reúne documentação de produto, arquitetura, auditorias, modelos, operação e governança.

Revisado em 15/10/2026 pela IE-00.02. Começar por PROJECT_STATE, ARCHITECTURE, GOVERNANCE e pelo roadmap. Documentos datados, o CASE_STUDY e trechos quantitativos/financeiros antigos preservam o histórico: não comprovam runtime, cobertura ou regras ativas após o remix de 01/10. [Snapshots e orientação de leitura](history/README.md).

Há dois níveis de leitura:

- **Portfólio** — problema, solução, arquitetura e competências demonstradas.
- **Técnico** — decisões quantitativas, segurança, Elo, operação, rastreabilidade e governança.

## Comece por aqui

| Documento | Para quem | O que mostra |
| --- | --- | --- |
| [roadmap EBSA 1.7](roadmap/INTELIGENCIA_ESPORTIVA_ROADMAP_EBSA_v1_7.md) | Planejamento e execução | códigos, dependências e critérios por entrega |
| [histórico documental](history/README.md) | Auditoria e continuidade | snapshots anteriores e limites das evidências datadas |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Produto, dados e engenharia | camadas, fluxo, boundaries, segurança e fontes de verdade |
| [PROJECT_STATE.md](PROJECT_STATE.md) | Continuidade técnica | estado canônico e decisões vigentes |
| [GOVERNANCE.md](GOVERNANCE.md) | Produto, dados e engenharia | responsáveis, change control, auditoria e revisão de acessos |
| [METRICS_GLOSSARY.md](METRICS_GLOSSARY.md) | Produto/Quant/Data | definições e versões dos indicadores |
| [DATA_CATALOG.md](DATA_CATALOG.md) | Dados/Backend | catálogo e governança das fontes |

## Backend e modelos — registros históricos

Os relatórios abaixo documentam o produto e o ambiente de setembro. Não ativam mercados, odds, banca ou apostas no produto atual. O [CASE_STUDY](CASE_STUDY.md) também é uma narrativa histórica de portfólio, não o estado operacional vigente.

| Documento | Conteúdo |
| --- | --- |
| [BACKEND_AUDIT_CLOSE_2026-09-10.md](BACKEND_AUDIT_CLOSE_2026-09-10.md) | fechamento da auditoria estrutural de backend |
| [BACKEND_MARKET_POLICY_2026-09-10.md](BACKEND_MARKET_POLICY_2026-09-10.md) | política de mercados e linhas |
| [BACKEND_ROUND3_QUANT_VALIDATION_2026-09-10.md](BACKEND_ROUND3_QUANT_VALIDATION_2026-09-10.md) | validação quantitativa e política NB2/Poisson |
| [FIVE_DOLLAR_API_AUDIT_2026-09-10.md](FIVE_DOLLAR_API_AUDIT_2026-09-10.md) | utilização e limitações da API esportiva |

## Elo

Referências vigentes:

| Documento | Conteúdo |
| --- | --- |
| [ELO.md](ELO.md) | definições de time, liga, global e point-in-time; trechos de impacto nos mercados pertencem ao legado |
| [ELO_RUNBOOK.md](ELO_RUNBOOK.md) | operação diária, pg_cron, auditoria e troubleshooting |

Trilha histórica de auditoria:

| Documento | Conteúdo |
| --- | --- |
| [ELO_AUDIT_2026-09-08.md](ELO_AUDIT_2026-09-08.md) | auditoria da camada hierárquica e cobertura operacional |
| [ELO_P1_HIERARCHICAL_INTEGRATION_2026-09-11.md](ELO_P1_HIERARCHICAL_INTEGRATION_2026-09-11.md) | conexão do Elo hierárquico ao fluxo cross-league |
| [ELO_P2_POINT_IN_TIME_2026-09-11.md](ELO_P2_POINT_IN_TIME_2026-09-11.md) | reconstrução histórica de rating de liga |
| [ELO_DECISION_HARDENING_2026-09-11.md](ELO_DECISION_HARDENING_2026-09-11.md) | revisão pós-Elo das regras de decisão e semântica de probabilidade |

## Segurança

| Documento | Conteúdo |
| --- | --- |
| [RLS_SECURITY.md](RLS_SECURITY.md) | política de RLS e privilégios do banco |
| [SECURITY_AUDIT_2026-09-10.md](SECURITY_AUDIT_2026-09-10.md) | auditoria histórica; não certifica o Cloud atual |

## Governança

- `GOVERNANCE.md`: matriz de responsabilidade, mudanças e cadências.
- `METRICS_GLOSSARY.md`: significado/versionamento dos indicadores.
- `DATA_CATALOG.md`: origem, contrato e revisão das fontes.
- `governance/access-reviews/`: evidências periódicas de revisão de acesso.

## Como interpretar a documentação

Para estrutura implementada, confrontar código e migrations da main com os documentos atuais. Para dados, jobs e permissões, consultar o PRIMARY vivo; a presença de uma migration no Git não comprova aplicação. Para finalidade e mudanças, usar PROJECT_STATE, GOVERNANCE e roadmap. Definições de métricas/fontes mantêm suas versões; trechos legados não governam a jornada atual. Relatórios e snapshots comprovam apenas o escopo e a data que registram.

Uma auditoria datada não vence automaticamente evidência do ambiente novo. Registro de separação e limites: [IE-00.02](governance/IE_00_02_CURRENT_STATE_HISTORY_2026-10-15.md).

- [Meus Jogos — foco vigente, implementação e aceite (16/10/2026)](governance/MEUS_JOGOS_SCOPE_2026-10-16.md).

- [Meus Jogos — rebranding e página única (16/10/2026)](governance/MEUS_JOGOS_REBRAND_2026-10-16.md).

- [Campinho, distribuição tática e avaliações pessoais (16/10/2026)](governance/MEUS_JOGOS_PITCH_2026-10-16.md).
