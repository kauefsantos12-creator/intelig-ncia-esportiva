# Retirada do runtime legado — Motor de Inteligência Esportiva

Data: 2026-09-16

## Objetivo

Retirar do código executável as superfícies exclusivas do antigo motor de apostas depois que o Lovable Cloud deixou de expor as tabelas, RPCs e jobs correspondentes. A mudança não reescreve migrations históricas: elas permanecem como trilha versionada e continuam sendo reaplicáveis no rebuild completo.

## Retirado do runtime

- upload/rascunho de CSV e fluxo de análise por `analysis_runs`;
- odds, bankroll, value, picks, seleção/portfolio e acompanhamento de apostas;
- filas e observabilidade exclusivas do antigo funil de decisão;
- treinamento, calibração e laboratório dos modelos de mercados;
- rotas de processamento, oportunidades, resultados, analytics de aposta e endpoints de workers descomissionados;
- deep-links e mensagens Web Push específicas de análise/odds.

## Preservado

- autenticação single-user, privacidade, RLS, governança e telemetria sanitizada;
- assinatura Web Push genérica, sem semântica de apostas;
- integrações esportivas canônicas e normalização de provedores;
- catálogo esportivo e estruturas de partidas, jogadores, transmissões, anotações e noticiário;
- núcleo e ledger de Elo, incluindo o endpoint protegido de sincronização;
- migrations históricas e documentação de auditorias anteriores como evidência, não como arquitetura ativa.

## Limite desta etapa

A home e o shell são apenas uma superfície neutra de transição para não expor rotas já desativadas. As novas abas de Noticiário, Hoje, Elo, Analytics e Anotações pertencem à fase de frontend e não são implementadas neste corte.

## Validação obrigatória

A mudança só pode avançar com lint, typecheck, boundaries de arquitetura, dependências, secret scan, governança, árvore de rotas, rebuild de migrations, regressões de segurança esportiva, unitários, build, orçamento de bundle, smoke de carga e matriz de navegadores/acessibilidade verdes.
