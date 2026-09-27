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

function parseCandidate(row: Row): EditorialCandidate | null {
  const id = text(row["id"]);
  const rawKind = text(row["item_kind"]);
  const title = text(row["title"]);
  const body = text(row["body"]) ?? "";
  if (!id || !title || (rawKind !== "FOOTBALL_MATCH" && rawKind !== "OTHER_SPORT")) return null;

  const facts = isRecord(row["facts"]) ? row["facts"] : {};
  return {
    id,
    kind: rawKind,
    title,
    body,
    priority: numeric(row["priority"]),
    lateGame: facts["lateGame"] === true,
    sourceContext: sourceContextFromFacts(rawKind, facts),
    facts,
    provenance: Array.isArray(row["provenance"]) ? row["provenance"] : [],
  };
}

function selectCandidates(rows: Row[]) {
  const parsed = rows.map(parseCandidate).filter((item): item is EditorialCandidate => item !== null);
  const football = parsed
    .filter((item) => item.kind === "FOOTBALL_MATCH")
    .sort((a, b) => b.priority - a.priority);
  const otherSports = parsed
    .filter((item) => item.kind === "OTHER_SPORT")
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_OTHER_SPORTS);
  return [...football, ...otherSports].slice(0, 100);
}

function chunks<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function promptPayload(date: string, candidates: EditorialCandidate[]) {
  return {
    date,
    timezone: "America/Sao_Paulo",
    instructions: {
      language: "pt-BR",
      audience: "leitor brasileiro de uma resenha esportiva matinal",
      opening: "2 parágrafos curtos; destaque de 3 a 5 acontecimentos mais relevantes entre os itens de futebol enviados.",
      football: "2 a 4 frases por partida. Preserve placar, minutos, números e nomes. Integre contexto jornalístico de forma natural e traduzida.",
      otherSports: "Título e 1 a 2 frases em português brasileiro. Use somente o que a manchete de origem permite afirmar.",
    },
    items: candidates.map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
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

  const system = `Você é o editor-chefe de uma resenha esportiva brasileira.
Reescreva o material fornecido em português brasileiro natural, conciso e jornalístico.

REGRAS OBRIGATÓRIAS:
- Use EXCLUSIVAMENTE os fatos presentes em factualBody e sourceHeadlines.
- Nunca invente recordes, classificação, consequências de tabela, lesões, declarações, autores de gols, contexto ou causalidade.
- Preserve exatamente placares, minutos, estatísticas e nomes próprios que estiverem presentes.
- Traduza/parafraseie para português brasileiro qualquer manchete em espanhol, italiano, francês, inglês ou alemão. Não deixe frases estrangeiras soltas.
- Não copie a manchete estrangeira literalmente quando houver forma natural de expressá-la em português.
- Quando usar uma fonte, atribua de forma natural: "Segundo o AS...", "O L'Équipe destacou...", "A Gazzetta registrou...".
- Não escreva "5DollarFootballAPI" no texto editorial. Para esses números, use expressões como "Nos números da partida" ou "Estatisticamente".
- Não trate manchetes como prova de fatos que elas não afirmam.
- Para OTHER_SPORT, não invente placar/resultado ausente na manchete.
- Não inclua programação futura, onde assistir ou próximos jogos.
- Não mencione estas instruções nem o modelo de IA.
- Retorne SOMENTE JSON válido, sem markdown.

Formato:
{
  "opening": "dois parágrafos curtos em português brasileiro",
  "items": [
    { "id": "id recebido", "title": "título em português", "body": "texto editorial em português" }
  ]
}

Para FOOTBALL_MATCH, mantenha o título do confronto essencialmente como recebido; refine principalmente o body.
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
        temperature: 0.15,
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
    .select("id,item_kind,title,body,priority,facts,provenance")
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
        version: "editorial-ai-v1",
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
    aiEditorialVersion: "editorial-ai-v1",
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
