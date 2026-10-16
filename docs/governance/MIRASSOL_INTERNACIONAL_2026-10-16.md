# Mirassol x Internacional — partida e elencos

**Solicitação:** Kauê, em 16/10/2026: “Precisa ter o Mirassol x Internacional e os elencos”.

**Escopo:** recuperação factual pontual no PRIMARY `hefuvmocohhpmnhwpkac`, pelo executor SQL do projeto Lovable `428fa571-e363-4bbf-ab2c-058451eba7dc`. Sem mudança de schema, autenticação/RLS, regras quantitativas, worker, crons, segredo, publicação ou audiência.

## Fontes e motivo

A captura do banco às 16h35 BRT não tinha essa partida; Mirassol tinha 31 jogadores ativos com coleta de 06/10 e Internacional tinha zero. A consulta da API-Football foi recusada com `QUOTA_LIMIT`, sem retry. A página única da 5Dollar para 16/10 retornou quatro jogos e `next_page=null`, sem Mirassol x Internacional; isso não prova ausência do jogo oficial nem cobertura integral do provedor.

Fontes consultadas em 16/10:

- [CBF — partida 832195](https://www.cbf.com.br/futebol-brasileiro/jogos/campeonato-brasileiro/serie-a/2026/mirassol-x-internacional/832195): identificação, data e horário recuperados na busca; abertura integral da página expirou. Os sites dos dois clubes confirmaram o confronto e o horário de forma independente.
- [Mirassol — elenco oficial](https://mirassolfc.com.br/blogs/elenco): agenda de 16/10 às 20h no Maião e **39 jogadores**. Técnico excluído da extração.
- [Internacional — elenco oficial](https://www.internacional.com.br/equipes/masculino): **27 jogadores**. Comissão técnica, saúde e apoio excluídos; Ronaldo, Thiago Maia e Villagra foram incluídos como meio-campistas após conferência dos perfis individuais oficiais.
- [Internacional — anúncio da partida](https://www.internacional.com.br/noticias/masculino/saiba-onde-assistir-ao-jogo-do-inter-contra-o-mirassol): 16/10 às 20h, 31ª rodada. Nenhuma nova evidência de transmissão foi inserida nesta carga.

## Procedimento reproduzível

O [SQL operacional](../../scripts/operations/2026-10-16-mirassol-internacional.sql) contém os fatos extraídos, URLs, horários de coleta, SHA-256 dos HTMLs e mapeamentos explícitos das identidades existentes. Não é migration e não é executado automaticamente pelo CI ou pelo app.

SHA-256 do SQL aplicado: `7ecbefc468d7a65b12e37e1257e558114b757d41629af3bf889649a838468d7f`.

- Registra `official + official-match-squad-v1` no catálogo para esse conjunto factual, sem habilitar coleta automática ou alterar a fonte editorial.
- Confere os UUIDs, nomes, IDs API-Football e país dos dois clubes e a competição auditada antes de escrever.
- Reutiliza **50 identidades**: 31 vínculos de elenco do Mirassol e 19 identidades já vinculadas ao Internacional em escalações anteriores. Aliases são explícitos e protegidos por nome anterior e vínculo ao clube; não há casamento aproximado automático.
- Cria **16 identidades oficiais** com chave de perfil do clube, sem inventar IDs de API-Football ou 5Dollar. A conciliação futura dessas identidades com outros provedores permanece pendente.
- Atualiza os nomes dessas identidades conforme a página oficial, preservando nome anterior e origem nos metadados; mantém os IDs já usados por estatísticas e avaliações.
- Insere 66 vínculos de elenco `provider=official`. A consulta do Analytics deduplica por jogador: 39 no Mirassol e 27 no Internacional, mesmo preservando os 31 vínculos anteriores da API.
- Cadastra o jogo como `SCHEDULED`, às `2026-10-16T23:00:00Z` (20h BRT), sem placar, escalação, resultado ou estatísticas presumidos. Evita segunda fixture dos mesmos clubes na mesma data e aborta em conflito.
- Preserva a etiqueta interna `2026/27` usada pela competição e pelo Analytics, registrando `official_season=2026`. Isso não homologa a etiqueta do Brasil nem altera semântica de temporada.

Um **elenco publicado pelo clube** não comprova convocação, disponibilidade ou titularidade para esta partida. Números de camisa são os publicados nas páginas, inclusive ausências ou repetições. A carga não cria escalação provável/confirmada, lesões, minutos, notas ou métricas.

## Evidência no PRIMARY

Antes de gravar, o mesmo corpo foi executado duas vezes dentro de uma transação revertida. As duas aplicações passaram nos guardas e produziram uma partida e 66 vínculos, sem duplicação. Após `ROLLBACK`, a leitura confirmou 584 fixtures, zero partida alvo, zero novas identidades oficiais, zero vínculos desta carga e catálogo oficial ausente. Permaneceram 247 estatísticas individuais e 249 linhas de escalação.

Depois da execução com `COMMIT`, uma nova leitura às **16h46min03s BRT de 16/10/2026** confirmou:

| Verificação | Resultado |
| --- | --- |
| Fixture oficial | `0f822af1-42d1-4b27-8bd6-b236ee65d52a`, uma linha |
| Consulta usada por Hoje (`get_today_tracked_fixtures`) | Mirassol x Internacional, 20h BRT, `SCHEDULED`, gols nulos |
| Elenco visível do Mirassol | 39 jogadores distintos; 39 vínculos oficiais |
| Elenco visível do Internacional | 27 jogadores distintos; 27 vínculos oficiais |
| Fonte registrada | `official / official-match-squad-v1 / ACTIVE` |
| Total de fixtures | 585 (antes: 584) |
| Estatísticas individuais / escalações existentes | 247 / 249, sem alteração |
| Escalações / estatísticas da partida nova | 0 / 0 |

A leitura usa a RPC real de Hoje e o mesmo recorte de tabelas/temporada do Analytics. Não houve teste visual autenticado, login Google ou publicação nesta ação; consultas administrativas não homologam essas jornadas. CI do candidato é registrado na PR.

## Limites, continuidade e reversão

A coleta automática permanece sem recuperação comprovada. Esta carga não corrige o destino antigo do worker nem libera uma fila acumulada, não fecha IE-03/IE-04/IE-05 ou a validação de produção e não muda a prioridade do roadmap. Relatos pessoais continuam separados da fixture oficial e dos elencos.

Para conferir novamente, começar por SELECTs da partida, fonte e vínculos deste `recovery_id`. O script permite repetição somente em 16/10 e aborta se a identidade, versão da fonte ou conjunto visível divergir; outra data exige nova conferência das fontes. Não substituir a chave oficial por um ID de API sem prova de correspondência e controle de duplicidade.

Reversão deve preservar qualquer avaliação ou nota criada depois desta carga. Não há `DELETE` automático de jogadores ou fixture: auditar dependências antes de desativar vínculos oficiais, restaurar nomes anteriores ou conciliar registros. Não apagar histórico ou executar cascata sobre dados pessoais.
