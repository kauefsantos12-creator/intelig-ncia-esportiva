import { sportsDb } from "./sports-db.server";
import { SportsJobExecutionError } from "./sports-job-policy";

const SOURCE_URL = "https://futnatv.net/";
const TIME_ZONE = "America/Sao_Paulo";
const SEASON = "2026/27";

type Row = Record<string, unknown>;

type FutNaTvListing = {
  home: string;
  away: string;
  kickoffLabel: string | null;
  broadcastRaw: string;
  broadcasters: string[];
};

type FixtureCandidate = {
  id: string;
  kickoffAt: string;
  home: string;
  away: string;
};

export type FutNaTvBroadcastSyncResult = {
  date: string;
  sourceUrl: string;
  parsedListings: number;
  matchedFixtures: number;
  insertedEvidence: number;
  unmatchedListings: number;
  ambiguousListings: number;
};

const BROADCAST_HINTS = [
  "espn",
  "disney",
  "youtube",
  "sportv",
  "premiere",
  "paramount",
  "sbt",
  "globo",
  "tv brasil",
  "nsports",
  "xsports",
  "sportynet",
  "dazn",
  "prime video",
  "cazétv",
  "caze tv",
  "record",
  "band",
  "tnt",
  "max",
  "apple tv",
];

const NOISE_PATTERNS = [
  /^image:/i,
  /^ícone de /i,
  /^encerrados/i,
  /^ao vivo/i,
  /^próximos/i,
  /^cronológico/i,
  /^destaques/i,
  /^jogos de futebol/i,
  /^\d+ jogos disponíveis/i,
  /^(segunda|terça|quarta|quinta|sexta|sábado|domingo),/i,
];

const STOP_TOKENS = new Set([
  "fc",
  "cf",
  "ac",
  "sc",
  "ec",
  "club",
  "clube",
  "de",
  "da",
  "do",
  "das",
  "dos",
  "del",
  "the",
]);

function isRecord(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function htmlToLines(html: string) {
  const withoutScripts = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "\n")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "\n")
    .replace(/<!--([\s\S]*?)-->/g, "\n");
  const withBreaks = withoutScripts
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:div|section|article|li|p|h[1-6]|tr|td|th|main|header|footer)>/gi, "\n")
    .replace(/<(?:div|section|article|li|p|h[1-6]|tr|td|th|main|header|footer)\b[^>]*>/gi, "\n");

  return decodeHtml(withBreaks.replace(/<[^>]+>/g, " "))
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((line) => !NOISE_PATTERNS.some((pattern) => pattern.test(line)));
}

function isKickoffLine(value: string) {
  return /^\d{1,2}h\d{2}$/.test(value);
}

function isSeparator(value: string) {
  return value.toLocaleLowerCase("pt-BR") === "x";
}

function isLegScore(value: string) {
  return /^(ida|volta)\s+\d+\s*[x×-]\s*\d+$/i.test(value) || /^ida\s+\d+x\d+$/i.test(value);
}

function looksLikeBroadcast(value: string) {
  const normalized = value.toLocaleLowerCase("pt-BR");
  return BROADCAST_HINTS.some((hint) => normalized.includes(hint));
}

function splitBroadcasters(value: string) {
  return value
    .replace(/\s+e\s+/gi, ",")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, all) => all.findIndex((candidate) => candidate.toLocaleLowerCase("pt-BR") === item.toLocaleLowerCase("pt-BR")) === index);
}

export function parseFutNaTvListings(html: string): FutNaTvListing[] {
  const lines = htmlToLines(html);
  const listings: FutNaTvListing[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const kickoffLabel = isKickoffLine(lines[index] ?? "") ? lines[index] : null;
    if (!kickoffLabel) continue;

    const home = lines[index + 1] ?? "";
    if (!home || isSeparator(home) || looksLikeBroadcast(home) || isKickoffLine(home)) continue;

    let separatorIndex = index + 2;
    while (separatorIndex < Math.min(lines.length, index + 6) && !isSeparator(lines[separatorIndex] ?? "")) {
      separatorIndex += 1;
    }
    if (separatorIndex >= lines.length || !isSeparator(lines[separatorIndex] ?? "")) continue;

    let awayIndex = separatorIndex + 1;
    if (isLegScore(lines[awayIndex] ?? "")) awayIndex += 1;
    const away = lines[awayIndex] ?? "";
    if (!away || looksLikeBroadcast(away) || isKickoffLine(away)) continue;

    let broadcastRaw = "";
    for (let cursor = awayIndex + 1; cursor < Math.min(lines.length, awayIndex + 8); cursor += 1) {
      const candidate = lines[cursor] ?? "";
      if (isKickoffLine(candidate)) break;
      if (looksLikeBroadcast(candidate)) {
        broadcastRaw = candidate;
        break;
      }
    }
    if (!broadcastRaw) continue;

    listings.push({
      home,
      away,
      kickoffLabel,
      broadcastRaw,
      broadcasters: splitBroadcasters(broadcastRaw),
    });
  }

  return listings;
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameTokens(value: string) {
  return normalizeName(value)
    .split(" ")
    .filter((token) => token.length >= 2 && !STOP_TOKENS.has(token));
}

function tokenMatches(source: string, candidate: string) {
  if (source === candidate) return true;
  const min = Math.min(source.length, candidate.length);
  return min >= 3 && (source.startsWith(candidate) || candidate.startsWith(source));
}

export function teamNameScore(source: string, candidate: string) {
  const normalizedSource = normalizeName(source);
  const normalizedCandidate = normalizeName(candidate);
  if (!normalizedSource || !normalizedCandidate) return 0;
  if (normalizedSource === normalizedCandidate) return 1;
  if (normalizedSource.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedSource)) return 0.92;

  const sourceTokens = nameTokens(source);
  const candidateTokens = nameTokens(candidate);
  if (!sourceTokens.length || !candidateTokens.length) return 0;

  const matched = sourceTokens.filter((token) => candidateTokens.some((candidateToken) => tokenMatches(token, candidateToken))).length;
  const denominator = Math.max(sourceTokens.length, candidateTokens.length);
  return denominator ? matched / denominator : 0;
}

function fixtureMatchScore(listing: FutNaTvListing, fixture: FixtureCandidate) {
  const home = teamNameScore(listing.home, fixture.home);
  const away = teamNameScore(listing.away, fixture.away);
  if (home < 0.5 || away < 0.5) return 0;
  return (home + away) / 2;
}

function dateBounds(date: string) {
  const start = new Date(`${date}T00:00:00-03:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const tolerance = 6 * 60 * 60 * 1000;
  return {
    start: new Date(start.getTime() - tolerance).toISOString(),
    end: new Date(end.getTime() + tolerance).toISOString(),
  };
}

function localDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function parseFixture(row: Row): FixtureCandidate | null {
  const id = text(row["id"]);
  const kickoffAt = text(row["kickoff_at"]);
  const homeRelation = isRecord(row["home_team"]) ? row["home_team"] : Array.isArray(row["home_team"]) && isRecord(row["home_team"][0]) ? row["home_team"][0] : null;
  const awayRelation = isRecord(row["away_team"]) ? row["away_team"] : Array.isArray(row["away_team"]) && isRecord(row["away_team"][0]) ? row["away_team"][0] : null;
  const home = homeRelation ? text(homeRelation["name"]) : null;
  const away = awayRelation ? text(awayRelation["name"]) : null;
  if (!id || !kickoffAt || !home || !away) return null;
  return { id, kickoffAt, home, away };
}

async function markState(input: {
  date: string;
  success: boolean;
  error?: string | null;
  metadata?: Row;
}) {
  const db = await sportsDb();
  const now = new Date().toISOString();
  const payload: Row = {
    provider: "futnatv",
    domain: "broadcasts",
    season: SEASON,
    cursor_value: input.date,
    last_attempt_at: now,
    last_error: input.success ? null : (input.error ?? "Falha desconhecida"),
    metadata: input.metadata ?? {},
    updated_at: now,
  };
  if (input.success) payload["last_success_at"] = now;
  const result = await db.from("sports_sync_state").upsert(payload, { onConflict: "provider,domain,season" });
  if (result.error) console.warn("[futnatv-broadcast-sync] failed to persist sync state", result.error.message);
}

export async function syncFutNaTvBroadcasts(date: string): Promise<FutNaTvBroadcastSyncResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new SportsJobExecutionError("INVALID_PAYLOAD", "BROADCAST_SYNC exige date em YYYY-MM-DD.");
  }

  const today = localDateKey(new Date());
  if (date !== today) {
    throw new SportsJobExecutionError("INVALID_PAYLOAD", `BROADCAST_SYNC só sincroniza a agenda corrente (${today}); recebido ${date}.`);
  }

  await markState({ date, success: false, error: null, metadata: { phase: "fetch" } });

  let response: Response;
  try {
    response = await fetch(SOURCE_URL, {
      headers: {
        "User-Agent": "MotorInteligenciaEsportiva/1.0 (+broadcast-sync)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markState({ date, success: false, error: message, metadata: { phase: "fetch" } });
    throw new SportsJobExecutionError("UPSTREAM_UNAVAILABLE", `FutNaTV indisponível: ${message}`);
  }

  if (!response.ok) {
    const message = `FutNaTV respondeu HTTP ${response.status}.`;
    await markState({ date, success: false, error: message, metadata: { phase: "fetch", status: response.status } });
    throw new SportsJobExecutionError("UPSTREAM_UNAVAILABLE", message);
  }

  const html = await response.text();
  const listings = parseFutNaTvListings(html);
  if (!listings.length) {
    const message = "FutNaTV não retornou partidas com transmissão em formato reconhecível.";
    await markState({ date, success: false, error: message, metadata: { phase: "parse", htmlBytes: html.length } });
    throw new SportsJobExecutionError("UPSTREAM_UNAVAILABLE", message);
  }

  const db = await sportsDb();
  const bounds = dateBounds(date);
  const fixturesResult = await db
    .from("sports_fixtures")
    .select("id,kickoff_at,home_team:sports_teams!sports_fixtures_home_team_id_fkey(name),away_team:sports_teams!sports_fixtures_away_team_id_fkey(name)")
    .gte("kickoff_at", bounds.start)
    .lt("kickoff_at", bounds.end)
    .limit(500);
  if (fixturesResult.error) {
    await markState({ date, success: false, error: fixturesResult.error.message, metadata: { phase: "fixtures" } });
    throw new Error(`Falha ao carregar fixtures para broadcast sync: ${fixturesResult.error.message}`);
  }

  const fixtures = (Array.isArray(fixturesResult.data) ? fixturesResult.data : [])
    .filter(isRecord)
    .map(parseFixture)
    .filter((fixture): fixture is FixtureCandidate => fixture !== null);

  const evidence: Row[] = [];
  const matchedFixtureIds = new Set<string>();
  let unmatchedListings = 0;
  let ambiguousListings = 0;
  const checkedAt = new Date().toISOString();

  for (const listing of listings) {
    const ranked = fixtures
      .map((fixture) => ({ fixture, score: fixtureMatchScore(listing, fixture) }))
      .filter((candidate) => candidate.score >= 0.7)
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];
    const second = ranked[1];
    if (!best) {
      unmatchedListings += 1;
      continue;
    }
    if (second && best.score - second.score < 0.08) {
      ambiguousListings += 1;
      continue;
    }

    matchedFixtureIds.add(best.fixture.id);
    listing.broadcasters.forEach((broadcaster, index) => {
      evidence.push({
        fixture_id: best.fixture.id,
        broadcaster,
        platform: null,
        source_kind: "FUTNATV",
        source_name: "FutNaTV",
        source_url: SOURCE_URL,
        checked_at: checkedAt,
        confidence: Math.max(0.7, Math.min(0.99, Number((best.score * 0.97).toFixed(2)))),
        is_primary: index === 0,
        metadata: {
          sourceHome: listing.home,
          sourceAway: listing.away,
          sourceKickoffLabel: listing.kickoffLabel,
          sourceBroadcastRaw: listing.broadcastRaw,
          matchScore: Number(best.score.toFixed(3)),
          syncDate: date,
        },
      });
    });
  }

  const fixtureIds = fixtures.map((fixture) => fixture.id);
  if (fixtureIds.length) {
    const deletion = await db.from("sports_broadcast_evidence").delete().eq("source_kind", "FUTNATV").in("fixture_id", fixtureIds);
    if (deletion.error) {
      await markState({ date, success: false, error: deletion.error.message, metadata: { phase: "replace" } });
      throw new Error(`Falha ao substituir evidências FutNaTV: ${deletion.error.message}`);
    }
  }

  if (evidence.length) {
    const insertion = await db.from("sports_broadcast_evidence").insert(evidence);
    if (insertion.error) {
      await markState({ date, success: false, error: insertion.error.message, metadata: { phase: "insert" } });
      throw new Error(`Falha ao persistir evidências FutNaTV: ${insertion.error.message}`);
    }
  }

  const result: FutNaTvBroadcastSyncResult = {
    date,
    sourceUrl: SOURCE_URL,
    parsedListings: listings.length,
    matchedFixtures: matchedFixtureIds.size,
    insertedEvidence: evidence.length,
    unmatchedListings,
    ambiguousListings,
  };
  await markState({ date, success: true, metadata: result });
  return result;
}
