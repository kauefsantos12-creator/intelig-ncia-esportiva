# Fases de implementação — Motor de Inteligência Esportiva

1. Fundação: cálculos determinísticos, acesso Elo e camada de dados de jogadores.
2. Elo: interface de clubes/ligas com filtros e histórico de 60 dias.
3. Hoje: agenda transmitida, normalização multi-source e sinais pré-jogo.
4. Anotações: fila pós-jogo, watched/not watched, campinho e notas pessoais.
5. Analytics 26/27: time, competição, elenco, jogadores e recortes por torneio.
6. Noticiário: match fact packs, resenha diária e movimentos relevantes de Elo.
7. Corte do produto anterior: desligar jobs de apostas, retirar navegação legada e somente depois auditar/excluir estruturas sem dependências.

Cada fase segue branch -> PR -> gates verdes -> merge -> sincronização Lovable -> publicação -> validação viva.
