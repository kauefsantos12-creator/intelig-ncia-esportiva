import { sportsDb } from "./sports-db.server";

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_MODEL = "google/gemini-3.7-flash";
const MAX_OTHER_SPORTS = 8;
const BATCH_SIZE = 12;
const REQUEST_TIMEOUT_MS = 45_000;
const EDITORIAL_VERSION = "editorial-ai-v2";
const AI_TEMPERATURE = 0.65;
const MAX_STANDOUTS_PER_FIXTURE = 3;

type Row = Record<string, unknown>;

type EditorialTier = 1 | 2 | 3;

type Standout = {
  player: string;
  team: string;
  rating: number | null;
  minutes: number | null;
  goals: number | null;
  assists: number | null;
  saves: number | null;
};

type EditorialCandidate = {
  id: string;
  fixtureId: string | null;
  kind: "FOOTBALL_MATCH" | "OTHER_SPORT" | "CLUB_FOCUS";
  tier: EditorialTier;
  title: string;
  body: string;
  priority: number;
  lateGame: boolean;
  sourceContext: Array<{ source: string; title: string }>;
  standouts: Standout[];
  goalScorers: string[];
  keyMoments: string[];

  facts: Row;
  provenance: unknown[];
};

type GatewayItem = {
  id: string;
  title: string;
  body: string;
};

type GatewayOutput = {
  opening: string;
  items: GatewayItem[];
};

export type EditorialAiRefinementResult = {
  date: string;
  status: "REFINED" | "SKIPPED" | "FAILED";
  model: string;
  candidates: number;
  updatedItems: number;
  generatedAt: string;
  reason?: string;
};

function isRecord(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numeric(value: unknown): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

function optionalNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function embeddedName(value: unknown): string | null {
  if (Array.isArray(value)) return embeddedName(value[0]);
  return isRecord(value) ? text(value["name"]) : null;
}

function minuteLabel(minute: number | null, added: number | null) {
  if (minute === null) return null;
  return `${minute}${added ? `+${added}` : ""}'`;
}

function classifyEvent(eventType: string, detail: string) {
  const type = eventType.toLowerCase();
  const info = detail.toLowerCase();

  if (type.includes("goal")) {
    if (info.includes("own")) return { bucket: "moment" as const, label: "gol contra" };
    if (info.includes("missed") || info.includes("saved")) {
      return { bucket: "moment" as const, label: info.includes("saved") ? "pênalti defendido" : "pênalti perdido" };
    }
    if (info.includes("penalty")) return { bucket: "goal" as const, label: "gol de pênalti" };
    return { bucket: "goal" as const, label: "gol" };
  }

  if (type.includes("penalt")) {
    if (info.includes("saved")) return { bucket: "moment" as const, label: "pênalti defendido" };
    if (info.includes("missed")) return { bucket: "moment" as const, label: "pênalti perdido" };
    if (info.includes("scored") || info.includes("converted")) return { bucket: "goal" as const, label: "gol de pênalti" };
    return { bucket: "moment" as const, label: "lance de pênalti" };
  }

  if (type.includes("card")) {
    if (info.includes("red")) return { bucket: "moment" as const, label: "cartão vermelho" };
    if (info.includes("second yellow") || info.includes("yellowred")) {
      return { bucket: "moment" as const, label: "expulso com o segundo amarelo" };
    }
    return null;
  }

  if (type.includes("var")) {
    if (info.includes("disallow") || info.includes("cancel") || info.includes("goal")) {
      return { bucket: "moment" as const, label: "gol anulado pelo árbitro de vídeo" };
    }
    return null;
  }

  return null;
}

async function attachMatchProtagonists(
  db: Awaited<ReturnType<typeof sportsDb>>,
  candidates: EditorialCandidate[],
) {
  const football = candidates.filter((item) => item.kind === "FOOTBALL_MATCH" && item.fixtureId);
  const statsTargets = football.filter((item) => item.tier <= 2);
  const fixtureIds = Array.from(new Set(football.map((item) => item.fixtureId as string)));
  if (fixtureIds.length === 0) return;
  const statsFixtureIds = Array.from(new Set(statsTargets.map((item) => item.fixtureId as string)));

  const [statsResult, eventsResult] = await Promise.all([
    statsFixtureIds.length
      ? db
        .from("sports_fixture_player_stats")
        .select("fixture_id,minutes,provider_rating,stats,sports_players(name),sports_teams(name)")
        .in("fixture_id", statsFixtureIds)
      : Promise.resolve({ data: [] as unknown[] }),
    db
      .from("sports_fixture_events")
      .select("fixture_id,minute,added_minute,event_type,detail,player_name,sports_teams(name)")
      .in("fixture_id", fixtureIds),
  ]);

  const standoutsByFixture = new Map<string, Standout[]>();
  for (const row of (Array.isArray(statsResult.data) ? statsResult.data : []).filter(isRecord)) {
    const fixtureId = text(row["fixture_id"]);
    const player = embeddedName(row["sports_players"]);
    if (!fixtureId || !player) continue;
    const stats = isRecord(row["stats"]) ? row["stats"] : {};
    const entry: Standout = {
      player,
      team: embeddedName(row["sports_teams"]) ?? "",
      rating: optionalNumber(row["provider_rating"]),
      minutes: optionalNumber(row["minutes"]),
      goals: optionalNumber(stats["goals"]),
      assists: optionalNumber(stats["assists"]),
      saves: optionalNumber(stats["saves"]),
    };
    const relevance = (entry.goals ?? 0) * 3 + (entry.assists ?? 0) * 2 + (entry.rating ?? 0);
    if (relevance <= 0) continue;
    const list = standoutsByFixture.get(fixtureId) ?? [];
    list.push(entry);
    standoutsByFixture.set(fixtureId, list);
  }

  const scorersByFixture = new Map<string, string[]>();
  const momentsByFixture = new Map<string, string[]>();
  for (const row of (Array.isArray(eventsResult.data) ? eventsResult.data : []).filter(isRecord)) {
    const fixtureId = text(row["fixture_id"]);
    const player = text(row["player_name"]);
    const eventType = text(row["event_type"]) ?? "";
    if (!fixtureId || !eventType) continue;
    const classified = classifyEvent(eventType, text(row["detail"]) ?? "");
    if (!classified) continue;

    const stamp = minuteLabel(optionalNumber(row["minute"]), optionalNumber(row["added_minute"]));
    const team = embeddedName(row["sports_teams"]);
    const who = player ?? team ?? "";
    const parts = [stamp, who, classified.bucket === "goal" && classified.label === "gol" ? null : `(${classified.label})`]
      .filter(Boolean);
    const label = parts.join(" ").trim();
    if (!label) continue;

    if (classified.bucket === "goal") {
      const list = scorersByFixture.get(fixtureId) ?? [];
      list.push(team && player ? `${label} — ${team}` : label);
      scorersByFixture.set(fixtureId, list);
    } else {
      const list = momentsByFixture.get(fixtureId) ?? [];
      list.push(team && player ? `${label} — ${team}` : label);
      momentsByFixture.set(fixtureId, list);
    }
  }

  for (const item of football) {
    const fixtureId = item.fixtureId as string;
    const standouts = (standoutsByFixture.get(fixtureId) ?? [])
      .sort((a, b) => ((b.goals ?? 0) * 3 + (b.assists ?? 0) * 2 + (b.rating ?? 0))
        - ((a.goals ?? 0) * 3 + (a.assists ?? 0) * 2 + (a.rating ?? 0)))
      .slice(0, MAX_STANDOUTS_PER_FIXTURE);
    item.standouts = standouts;
    item.goalScorers = (scorersByFixture.get(fixtureId) ?? []).slice(0, 8);
    item.keyMoments = (momentsByFixture.get(fixtureId) ?? []).slice(0, 6);
  }
}



function cleanAiText(value: unknown, maxLength: number) {
  const result = text(value);
  if (!result) return null;
  return result
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim()
    .slice(0, maxLength);
}

function sourceContextFromFacts(kind: EditorialCandidate["kind"], facts: Row) {
  const sources: Array<{ source: string; title: string }> = [];

  if (kind === "FOOTBALL_MATCH") {
    const entries = Array.isArray(facts["journalismContext"]) ? facts["journalismContext"] : [];
    for (const entry of entries) {
      if (!isRecord(entry)) continue;
      const source = text(entry["source"]);
      const title = text(entry["title"]);
      if (source && title) sources.push({ source, title });
    }
  }

  if (kind === "OTHER_SPORT") {
    const source = text(facts["sourceName"]) ?? text(facts["source"]);
    const title = text(facts["sourceTitle"]) ?? text(facts["title"]);
    if (source && title) sources.push({ source, title });
  }

  return sources.slice(0, 3);
}

const MAJOR_PATTERN = /(champions league|libertadores|world cup|copa america|copa américa|european championship|eurocopa|nations league a\b|final)/i;
const MARQUEE_PATTERN = /(champions league|libertadores|sudamericana|europa league|copa do brasil|copa del rey|fa cup|final|classico|clássico|derby|nations league|world cup|copa america|copa américa|eliminat|qualif|international|friendl|euro)/i;

const BIG_CLUBS = new Set([
  "real madrid", "barcelona", "atletico madrid", "manchester city", "manchester united",
  "liverpool", "arsenal", "chelsea", "tottenham", "bayern munich", "bayern munchen",
  "borussia dortmund", "juventus", "inter", "ac milan", "napoli", "psg", "paris saint germain",
  "benfica", "porto", "sporting", "ajax", "palmeiras", "flamengo", "corinthians", "sao paulo",
  "gremio", "internacional", "santos", "fluminense", "botafogo", "atletico mineiro", "cruzeiro",
  "boca juniors", "river plate", "brazil", "argentina", "france", "england", "spain", "germany",
  "portugal", "italy", "netherlands", "uruguay", "colombia",
]);

function normalizeName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

function teamsFromTitle(title: string) {
  const parts = title.split(/\s\d+\s×\s\d+\s/);
  if (parts.length !== 2) return [] as string[];
  return parts.map((part) => normalizeName(part)).filter(Boolean);
}

function editorialTier(kind: EditorialCandidate["kind"], title: string, facts: Row): EditorialTier {
  if (kind !== "FOOTBALL_MATCH") return 2;
  const competition = text(facts["competition"]) ?? "";
  const teams = teamsFromTitle(title);
  const bigTeams = teams.filter((team) => BIG_CLUBS.has(team)).length;
  const margin = numeric(facts["margin"]);
  const goals = isRecord(facts["score"])
    ? numeric(facts["score"]["home"]) + numeric(facts["score"]["away"])
    : 0;
  const hasJournalism = Array.isArray(facts["journalismContext"]) && facts["journalismContext"].length > 0;

  if (bigTeams >= 2) return 1;
  if (bigTeams >= 1 && (MARQUEE_PATTERN.test(competition) || hasJournalism)) return 1;
  if (MAJOR_PATTERN.test(competition) && (margin <= 1 || goals >= 4)) return 1;
  if (bigTeams >= 1 || MARQUEE_PATTERN.test(competition) || goals >= 4 || margin >= 3 || hasJournalism) return 2;
  return 3;
}

function parseCandidate(row: Row): EditorialCandidate | null {
  const id = text(row["id"]);
  const rawKind = text(row["item_kind"]);
  const title = text(row["title"]);
  const body = text(row["body"]) ?? "";
  if (!id || !title) return null;

  const facts = isRecord(row["facts"]) ? row["facts"] : {};
  const isClubFocus = rawKind === "NEWS_CONTEXT" && text(facts["section"]) === "palmeiras";
  const kind: EditorialCandidate["kind"] | null =
    rawKind === "FOOTBALL_MATCH" ? "FOOTBALL_MATCH"
      : rawKind === "OTHER_SPORT" ? "OTHER_SPORT"
        : isClubFocus ? "CLUB_FOCUS"
          : null;
  if (!kind) return null;

  return {
    id,
    fixtureId: text(row["fixture_id"]),
    kind,
    tier: editorialTier(kind, title, facts),
    title,
    body,
    priority: numeric(row["priority"]),
    lateGame: facts["lateGame"] === true,
    sourceContext: sourceContextFromFacts(kind === "CLUB_FOCUS" ? "FOOTBALL_MATCH" : kind, facts),
    standouts: [],
    goalScorers: [],
    keyMoments: [],

    facts,
    provenance: Array.isArray(row["provenance"]) ? row["provenance"] : [],
  };
}

function selectCandidates(rows: Row[]) {
  const parsed = rows.map(parseCandidate).filter((item): item is EditorialCandidate => item !== null);
  const clubFocus = parsed.filter((item) => item.kind === "CLUB_FOCUS");
  const football = parsed
    .filter((item) => item.kind === "FOOTBALL_MATCH")
    .sort((a, b) => a.tier - b.tier || b.priority - a.priority);
  const otherSports = parsed
    .filter((item) => item.kind === "OTHER_SPORT")
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_OTHER_SPORTS);
  return [...clubFocus, ...football, ...otherSports].slice(0, 100);
}

function chunks<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

const TIER_GUIDANCE: Record<EditorialTier, string> = {
  1: "JOGO GRANDE: 4 a 6 frases. Conte o roteiro do jogo (quem mandou, quando virou, o lance que decidiu), cite os minutos dos gols, destaque os protagonistas pelo nome e use as estatísticas para explicar a dinâmica. Integre o contexto das fontes jornalísticas.",
  2: "JOGO RELEVANTE: 2 a 3 frases densas. Narre como o placar foi construído, quem decidiu e um número que explique a partida.",
  3: "JOGO DE ROTINA: 1 frase objetiva com o placar e quem resolveu. Só escreva uma segunda frase se houver algo realmente fora do comum (virada no fim, goleada, expulsão decisiva, zebra).",
};

function promptPayload(date: string, candidates: EditorialCandidate[]) {
  return {
    date,
    timezone: "America/Sao_Paulo",
    instructions: {
      language: "pt-BR",
      audience: "torcedor brasileiro que lê uma resenha esportiva matinal bem escrita",
      voice: "jornalismo esportivo de revista: frases vivas, verbos de ação, zero burocracia.",
      opening: "2 parágrafos de abertura com o que realmente importou no dia, começando pelos jogos grandes e pelas seleções. Escreva como chamada de capa, não como relatório.",
      depth: "Respeite o campo 'tier' de cada item: ele define quanto espaço o jogo merece.",
      players: "Quando houver 'standouts' ou 'goalScorers', cite os jogadores pelo nome com o que eles fizeram em campo.",
      stats: "Transforme números em narrativa (posse que não virou perigo, volume de finalizações que explicou a goleada). Nunca liste números soltos.",
      otherSports: "Título e 1 a 2 frases em português brasileiro. Use somente o que a manchete de origem permite afirmar.",
      clubFocus: "Bloco fixo do Palmeiras. Se houve jogo, conte o desempenho. Se não houve, escreva uma nota curta e natural de torcedor sobre o clube ter ficado fora de campo na data — nunca uma mensagem de sistema.",
    },
    items: candidates.map((item) => ({
      id: item.id,
      kind: item.kind,
      tier: item.tier,
      depth: TIER_GUIDANCE[item.tier],
      title: item.title,
      competition: text(item.facts["competition"]),
      score: item.facts["score"] ?? null,
      goalTimeline: text(item.facts["goalTimeline"]),
      lateGame: item.lateGame,
      matchStats: isRecord(item.facts["editorialStats"]) ? item.facts["editorialStats"]["values"] ?? null : null,
      standouts: item.standouts,
      goalScorers: item.goalScorers,
      factualBody: item.body,
      sourceHeadlines: item.sourceContext,
    })),
  };
}

function extractMessageContent(payload: unknown) {
  const root = isRecord(payload) ? payload : null;
  const choices = Array.isArray(root?.["choices"]) ? root?.["choices"] : [];
  const first = choices[0];
  if (!isRecord(first)) return null;
  const message = isRecord(first["message"]) ? first["message"] : null;
  const content = message?.["content"];
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => isRecord(part) && typeof part["text"] === "string" ? part["text"] : "")
      .join("");
  }
  return null;
}

function parseGatewayOutput(payload: unknown, allowedIds: Set<string>): GatewayOutput | null {
  const raw = extractMessageContent(payload);
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const fenced = raw.match(/\{[\s\S]*\}/);
    if (!fenced) return null;
    try {
      parsed = JSON.parse(fenced[0]);
    } catch {
      return null;
    }
  }

  if (!isRecord(parsed)) return null;
  const opening = cleanAiText(parsed["opening"], 1_800);
  const entries = Array.isArray(parsed["items"]) ? parsed["items"] : [];
  const seen = new Set<string>();
  const items: GatewayItem[] = [];

  for (const entry of entries) {
    if (!isRecord(entry)) continue;
    const id = text(entry["id"]);
    const title = cleanAiText(entry["title"], 280);
    const body = cleanAiText(entry["body"], 1_500);
    if (!id || !allowedIds.has(id) || seen.has(id) || !title || !body) continue;
    seen.add(id);
    items.push({ id, title, body });
  }

  if (!opening || items.length === 0) return null;
  return { opening, items };
}

async function callGateway(date: string, candidates: EditorialCandidate[]) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    return { output: null as GatewayOutput | null, reason: "LOVABLE_API_KEY indisponível no runtime." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const system = `Você é o editor-chefe de uma resenha esportiva brasileira de alto nível, no tom de The Athletic e Trivela.
Escreva como quem viu o jogo: frases vivas, verbos de ação, ritmo de crônica curta. Nada de relatório, ata ou log de sistema.

HIERARQUIA (campo "tier" de cada item):
- tier 1 (clássicos, decisões, seleções, times grandes): 4 a 6 frases com roteiro do jogo, minutos dos gols, protagonistas e o número que explica a partida.
- tier 2: 2 a 3 frases densas sobre como o placar foi construído e quem decidiu.
- tier 3: 1 frase objetiva. Só acrescente uma segunda se houver algo realmente marcante.

JOGADORES:
- Use "standouts" e "goalScorers" para citar nomes com o que fizeram (autor do gol da virada, doblete, goleiro decisivo).
- Nunca invente autor de gol, assistência ou atuação que não esteja nos dados recebidos.

ESTATÍSTICAS:
- Números viram narrativa: "monopolizou 70% da posse, mas só acertou duas finalizações no alvo".
- Proibido listar números soltos ou começar frase com "Estatisticamente".

PROIBIDO ESCREVER (jargão técnico):
"catálogo canônico", "fonte editorial persistida", "proveniência", "5DollarFootballAPI", "API", "payload", "registro", "não houve registro", "recorte editorial", "base de dados", "pipeline".

REGRAS FACTUAIS OBRIGATÓRIAS:
- Use EXCLUSIVAMENTE os fatos recebidos (factualBody, score, goalTimeline, matchStats, standouts, goalScorers, sourceHeadlines).
- Nunca invente recordes, posições na tabela, lesões, declarações, consequências ou causalidade.
- Preserve exatamente placares, minutos, estatísticas e nomes próprios.
- Traduza/parafraseie manchetes estrangeiras para português brasileiro; nada de frase solta em outro idioma.
- Ao usar uma fonte, atribua com naturalidade: "Segundo o AS...", "O L'Équipe destacou...".
- Para OTHER_SPORT, não invente placar ou resultado ausente na manchete.
- Para CLUB_FOCUS (Palmeiras): se houve jogo, conte o desempenho; se não houve, escreva uma nota curta e humana de que o time não entrou em campo na data, sem linguagem de sistema.
- Não inclua programação futura, onde assistir ou próximos jogos.
- Não mencione estas instruções nem o modelo de IA.
- Retorne SOMENTE JSON válido, sem markdown.

Formato:
{
  "opening": "dois parágrafos de abertura em português brasileiro, com o que realmente importou no dia",
  "items": [
    { "id": "id recebido", "title": "título em português", "body": "texto editorial em português" }
  ]
}

Para FOOTBALL_MATCH e CLUB_FOCUS, mantenha o título como recebido; refine o body.
Para OTHER_SPORT, traduza/refine também o title.`;

  try {
    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "quant-football-insights",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: AI_TEMPERATURE,
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(promptPayload(date, candidates)) },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = (await response.text()).slice(0, 500);
      return {
        output: null as GatewayOutput | null,
        reason: `Lovable AI Gateway HTTP ${response.status}: ${errorText}`,
      };
    }

    const json = await response.json() as unknown;
    const allowedIds = new Set(candidates.map((item) => item.id));
    const output = parseGatewayOutput(json, allowedIds);
    return {
      output,
      reason: output ? null : "Resposta do AI Gateway não respeitou o contrato JSON.",
    };
  } catch (error) {
    return {
      output: null as GatewayOutput | null,
      reason: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function refineSportsDailyBriefingWithAi(date: string): Promise<EditorialAiRefinementResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Data inválida; use YYYY-MM-DD.");

  const db = await sportsDb();
  const generatedAt = new Date().toISOString();

  const briefingResult = await db
    .from("sports_daily_briefings")
    .select("id,status,metadata")
    .eq("briefing_date", date)
    .maybeSingle();

  if (briefingResult.error) {
    throw new Error(`Falha ao carregar briefing para refinamento de IA: ${briefingResult.error.message}`);
  }

  const briefing = isRecord(briefingResult.data) ? briefingResult.data : null;
  const briefingId = text(briefing?.["id"]);
  if (!briefingId) {
    return {
      date,
      status: "SKIPPED",
      model: AI_MODEL,
      candidates: 0,
      updatedItems: 0,
      generatedAt,
      reason: "Briefing não encontrado.",
    };
  }

  const itemsResult = await db
    .from("sports_briefing_items")
    .select("id,fixture_id,item_kind,title,body,priority,facts,provenance")
    .eq("briefing_id", briefingId)
    .order("priority", { ascending: false })
    .limit(100);

  if (itemsResult.error) {
    throw new Error(`Falha ao carregar itens para refinamento de IA: ${itemsResult.error.message}`);
  }

  const rows = Array.isArray(itemsResult.data) ? itemsResult.data.filter(isRecord) : [];
  const candidates = selectCandidates(rows);
  if (candidates.length === 0) {
    return {
      date,
      status: "SKIPPED",
      model: AI_MODEL,
      candidates: 0,
      updatedItems: 0,
      generatedAt,
      reason: "Nenhum item editorial elegível.",
    };
  }

  await attachMatchProtagonists(db, candidates);

  const currentMetadata = isRecord(briefing?.["metadata"]) ? briefing?.["metadata"] : {};
  const batches = chunks(candidates, BATCH_SIZE);
  const batchResults = await Promise.all(batches.map(async (batch) => {
    let gateway = await callGateway(date, batch);
    if (!gateway.output) gateway = await callGateway(date, batch);
    return gateway;
  }));
  const refinedItems: GatewayItem[] = [];
  let opening: string | null = null;
  const errors: string[] = [];

  for (const gateway of batchResults) {
    if (!gateway.output) {
      errors.push(gateway.reason ?? "Falha desconhecida no lote.");
      continue;
    }
    opening ??= gateway.output.opening;
    refinedItems.push(...gateway.output.items);
  }

  if (!opening || refinedItems.length === 0) {
    const failedMetadata = {
      ...currentMetadata,
      aiEditorialStatus: "FAILED",
      aiEditorialModel: AI_MODEL,
      aiEditorialAttemptedAt: generatedAt,
      aiEditorialError: errors.join(" | ").slice(0, 1500) || "Falha desconhecida.",
    };
    await db.from("sports_daily_briefings").update({ metadata: failedMetadata, updated_at: generatedAt }).eq("id", briefingId);
    return {
      date,
      status: "FAILED",
      model: AI_MODEL,
      candidates: candidates.length,
      updatedItems: 0,
      generatedAt,
      reason: failedMetadata.aiEditorialError,
    };
  }

  const byId = new Map(candidates.map((item) => [item.id, item]));
  let updatedItems = 0;

  for (const refined of refinedItems) {
    const original = byId.get(refined.id);
    if (!original) continue;

    const existingAi = original.provenance.filter((entry) => (
      !isRecord(entry) || entry["role"] !== "ai_editorial_transform"
    ));
    const provenance = [
      ...existingAi,
      {
        source: "Lovable AI Gateway",
        model: AI_MODEL,
        role: "ai_editorial_transform",
        generatedAt,
      },
    ];
    const facts = {
      ...original.facts,
      aiEditorial: {
        model: AI_MODEL,
        generatedAt,
        sourceBound: true,
        version: EDITORIAL_VERSION,
        tier: original.tier,
      },
    };

    const update: Record<string, unknown> = {
      body: refined.body,
      facts,
      provenance,
    };
    if (original.kind === "OTHER_SPORT") update["title"] = refined.title;

    const updateResult = await db
      .from("sports_briefing_items")
      .update(update)
      .eq("id", original.id);
    if (updateResult.error) {
      console.warn("[editorial-ai] item update failed", original.id, updateResult.error.message);
      continue;
    }
    updatedItems += 1;
  }

  const successMetadata = {
    ...currentMetadata,
    aiEditorialStatus: "REFINED",
    aiEditorialModel: AI_MODEL,
    aiEditorialVersion: EDITORIAL_VERSION,
    aiEditorialCandidates: candidates.length,
    aiEditorialItems: updatedItems,
    aiEditorialBatches: batches.length,
    aiEditorialBatchErrors: errors.length,
    aiEditorialGeneratedAt: generatedAt,
    aiEditorialSourceBound: true,
  };

  const briefingUpdate = await db
    .from("sports_daily_briefings")
    .update({
      football_summary: opening,
      metadata: successMetadata,
      updated_at: generatedAt,
    })
    .eq("id", briefingId);

  if (briefingUpdate.error) {
    throw new Error(`Falha ao persistir abertura editorial de IA: ${briefingUpdate.error.message}`);
  }

  return {
    date,
    status: "REFINED",
    model: AI_MODEL,
    candidates: candidates.length,
    updatedItems,
    generatedAt,
  };
}
