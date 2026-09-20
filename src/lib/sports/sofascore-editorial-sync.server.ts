import { sportsDb } from "./sports-db.server";

const BASE = "https://api.sofascore.com/api/v1";
const TIME_ZONE = "America/Sao_Paulo";
const MAX_EDITORIAL_MATCHES = 12;
const REQUEST_TIMEOUT_MS = 15_000;
const REQUEST_GAP_MS = 180;

type Row = Record<string, unknown>;

type CanonicalFixture = {
  id: string;
  kickoffAt: string;
  home: string;
  away: string;
  homeGoals: number | null;
  awayGoals: number | null;
  competition: string;
  countryCode: string | null;
  region: string | null;
  competitionKind: string;
  divisionLevel: number | null;
  priority: number;
};

type SofaEvent = {
  id: number;
  home: string;
  away: string;
  kickoffAt: string | null;
  homeScore: number | null;
  awayScore: number | null;
};

export type SofaScoreEditorialSyncResult = {
  date: string;
  sourceUrl: string;
  scheduledEvents: number;
  canonicalCandidates: number;
  matchedFixtures: number;
  statsFetched: number;
  evidenceUpserted: number;
  unmatchedFixtures: number;
  ambiguousFixtures: number;
  failedStats: number;
  fetchedAt: string;
};

function asRecord(value: unknown): Row | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Row : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace("%", "")) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\b(fc|cf|ac|sc|ec|se|ssd|afc|club|clube|de|da|do|das|dos|the)\b/g, " ")
    .replace(/\bnew york\b/g, "ny")
    .replace(/\bmunich\b/g, "munchen")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameTokens(value: string) {
  return normalizeName(value).split(" ").filter((token) => token.length >= 2);
}

export function sofaTeamNameScore(source: string, candidate: string) {
  const a = normalizeName(source);
  const b = normalizeName(candidate);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.93;

  const aTokens = nameTokens(source);
  const bTokens = nameTokens(candidate);
  if (!aTokens.length || !bTokens.length) return 0;

  const matched = aTokens.filter((token) => bTokens.some((other) => (
    token === other || (Math.min(token.length, other.length) >= 4 && (token.startsWith(other) || other.startsWith(token)))
  ))).length;
  return matched / Math.max(aTokens.length, bTokens.length);
}

function eventMatchScore(fixture: CanonicalFixture, event: SofaEvent) {
  const home = sofaTeamNameScore(fixture.home, event.home);
  const away = sofaTeamNameScore(fixture.away, event.away);
  if (home < 0.5 || away < 0.5) return 0;

  let score = (home + away) / 2;
  if (
    fixture.homeGoals !== null &&
    fixture.awayGoals !== null &&
    event.homeScore !== null &&
    event.awayScore !== null
  ) {
    score += fixture.homeGoals === event.homeScore && fixture.awayGoals === event.awayScore ? 0.1 : -0.15;
  }
  if (event.kickoffAt) {
    const deltaMinutes = Math.abs(Date.parse(fixture.kickoffAt) - Date.parse(event.kickoffAt)) / 60_000;
    if (Number.isFinite(deltaMinutes)) {
      if (deltaMinutes <= 15) score += 0.08;
      else if (deltaMinutes <= 120) score += 0.03;
      else if (deltaMinutes > 360) score -= 0.15;
    }
  }
  return Math.max(0, Math.min(1.2, score));
}

function editorialPriority(row: CanonicalFixture) {
  const competition = row.competition.toLocaleLowerCase("pt-BR");
  if (normalizeName(row.home) === "palmeiras" || normalizeName(row.away) === "palmeiras") return 600;
  if (["GB-ENG", "DE", "FR", "IT", "ES", "BR"].includes(row.countryCode ?? "") && row.divisionLevel === 1) return 500;
  if (row.competitionKind === "CONTINENTAL" && ["EUROPE", "SOUTH_AMERICA"].includes(row.region ?? "")) return 480;
  if (/fa cup|efl cup|copa del rey|coppa italia|coupe de france|dfb.*pokal|copa do brasil/.test(competition)) return 460;
  if (["GB-ENG", "DE", "FR", "IT", "ES", "BR"].includes(row.countryCode ?? "") && row.divisionLevel === 2) return 420;
  if (row.countryCode === "AR" && row.divisionLevel === 1) return 380;
  if (row.countryCode === "US" && competition.includes("mls")) return 360;
  if (competition.includes("saudi")) return 340;
  if (competition.includes("international")) return 320;
  return 0;
}

function parseSofaEvents(payload: unknown): SofaEvent[] {
  const root = asRecord(payload);
  const values = Array.isArray(root?.["events"]) ? root?.["events"] as unknown[] : [];
  return values.map(asRecord).map((event): SofaEvent | null => {
    if (!event) return null;
    const id = numberValue(event["id"]);
    const homeTeam = asRecord(event["homeTeam"]);
    const awayTeam = asRecord(event["awayTeam"]);
    const homeScore = asRecord(event["homeScore"]);
    const awayScore = asRecord(event["awayScore"]);
    const startTimestamp = numberValue(event["startTimestamp"]);
    const home = text(homeTeam?.["name"]);
    const away = text(awayTeam?.["name"]);
    if (id === null || !home || !away) return null;
    return {
      id,
      home,
      away,
      kickoffAt: startTimestamp === null ? null : new Date(startTimestamp * 1000).toISOString(),
      homeScore: numberValue(homeScore?.["current"]),
      awayScore: numberValue(awayScore?.["current"]),
    };
  }).filter((event): event is SofaEvent => event !== null);
}

function allPeriodStatistics(payload: unknown) {
  const root = asRecord(payload);
  const periods = Array.isArray(root?.["statistics"]) ? root?.["statistics"] as unknown[] : [];
  const all = periods.map(asRecord).find((period) => text(period?.["period"]) === "ALL") ?? periods.map(asRecord)[0] ?? null;
  if (!all) return [] as Row[];
  const groups = Array.isArray(all["groups"]) ? all["groups"] as unknown[] : [];
  return groups
    .map(asRecord)
    .filter((group): group is Row => group !== null)
    .flatMap((group) => Array.isArray(group["statisticsItems"]) ? group["statisticsItems"] as unknown[] : [])
    .map(asRecord)
    .filter((item): item is Row => item !== null);
}

function statPair(items: Row[], keys: string[], names: string[]) {
  const lowerNames = names.map((name) => name.toLocaleLowerCase("en-US"));
  const item = items.find((candidate) => {
    const key = text(candidate["key"]);
    const name = text(candidate["name"])?.toLocaleLowerCase("en-US") ?? null;
    return (key !== null && keys.includes(key)) || (name !== null && lowerNames.includes(name));
  });
  if (!item) return null;
  const home = numberValue(item["homeValue"] ?? item["home"]);
  const away = numberValue(item["awayValue"] ?? item["away"]);
  return home === null || away === null ? null : { home, away };
}

export function extractSofaScoreCuratedStats(payload: unknown) {
  const items = allPeriodStatistics(payload);
  return {
    expectedGoals: statPair(items, ["expectedGoals"], ["Expected goals"]),
    shotsOnTarget: statPair(items, ["shotsOnTarget"], ["Shots on target"]),
    possession: statPair(items, ["ballPossession"], ["Ball possession"]),
    corners: statPair(items, ["cornerKicks"], ["Corner kicks"]),
    totalShots: statPair(items, ["totalShots"], ["Total shots"]),
  };
}

async function sofaGet(path: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE}${path}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; SportsIntelligence/1.0; +editorial-stats)",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`SofaScore HTTP ${response.status} em ${path}`);
    return { payload: await response.json() as unknown, fetchedAt: new Date().toISOString() };
  } finally {
    clearTimeout(timer);
  }
}

async function loadCanonicalFixtures(date: string): Promise<CanonicalFixture[]> {
  const db = await sportsDb();
  const start = new Date(`${date}T00:00:00-03:00`).toISOString();
  const end = new Date(new Date(start).getTime() + 86_400_000).toISOString();
  const result = await db.from("sports_fixtures")
    .select("id,kickoff_at,status,home_goals,away_goals,home_team:sports_teams!sports_fixtures_home_team_id_fkey(name),away_team:sports_teams!sports_fixtures_away_team_id_fkey(name),competition:sports_competitions!sports_fixtures_competition_id_fkey(name,country_code,region,competition_kind,division_level)")
    .eq("status", "FINISHED")
    .gte("kickoff_at", start)
    .lt("kickoff_at", end)
    .limit(500);
  if (result.error) throw new Error(`Falha ao carregar fixtures canônicas para SofaScore: ${result.error.message}`);

  const rows = Array.isArray(result.data) ? result.data.filter(asRecord) : [];
  const fixtures = rows.map((row): CanonicalFixture | null => {
    const homeRelation = asRecord(row["home_team"]) ?? (Array.isArray(row["home_team"]) ? asRecord(row["home_team"][0]) : null);
    const awayRelation = asRecord(row["away_team"]) ?? (Array.isArray(row["away_team"]) ? asRecord(row["away_team"][0]) : null);
    const competition = asRecord(row["competition"]) ?? (Array.isArray(row["competition"]) ? asRecord(row["competition"][0]) : null);
    const id = text(row["id"]);
    const kickoffAt = text(row["kickoff_at"]);
    const home = text(homeRelation?.["name"]);
    const away = text(awayRelation?.["name"]);
    const competitionName = text(competition?.["name"]);
    const competitionKind = text(competition?.["competition_kind"]);
    if (!id || !kickoffAt || !home || !away || !competitionName || !competitionKind) return null;
    const fixture: CanonicalFixture = {
      id,
      kickoffAt,
      home,
      away,
      homeGoals: numberValue(row["home_goals"]),
      awayGoals: numberValue(row["away_goals"]),
      competition: competitionName,
      countryCode: text(competition?.["country_code"]),
      region: text(competition?.["region"]),
      competitionKind,
      divisionLevel: numberValue(competition?.["division_level"]),
      priority: 0,
    };
    fixture.priority = editorialPriority(fixture);
    return fixture;
  }).filter((fixture): fixture is CanonicalFixture => fixture !== null && fixture.priority > 0);

  return fixtures
    .sort((a, b) => b.priority - a.priority || Math.abs((b.homeGoals ?? 0) - (b.awayGoals ?? 0)) - Math.abs((a.homeGoals ?? 0) - (a.awayGoals ?? 0)))
    .slice(0, MAX_EDITORIAL_MATCHES);
}

export async function syncSofaScoreEditorialStats(date: string): Promise<SofaScoreEditorialSyncResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Data inválida para SofaScore; use YYYY-MM-DD.");

  const db = await sportsDb();
  const schedule = await sofaGet(`/sport/football/scheduled-events/${date}`);
  const events = parseSofaEvents(schedule.payload);
  const fixtures = await loadCanonicalFixtures(date);
  const matched: Array<{ fixture: CanonicalFixture; event: SofaEvent; score: number }> = [];
  let ambiguousFixtures = 0;

  for (const fixture of fixtures) {
    const candidates = events
      .map((event) => ({ event, score: eventMatchScore(fixture, event) }))
      .filter((candidate) => candidate.score >= 0.72)
      .sort((a, b) => b.score - a.score);
    const best = candidates[0];
    if (!best) continue;
    const second = candidates[1];
    if (second && best.score - second.score < 0.08) {
      ambiguousFixtures += 1;
      continue;
    }
    matched.push({ fixture, event: best.event, score: best.score });
  }

  let statsFetched = 0;
  let evidenceUpserted = 0;
  let failedStats = 0;
  let latestFetchedAt = schedule.fetchedAt;

  for (const match of matched) {
    try {
      const stats = await sofaGet(`/event/${match.event.id}/statistics`);
      latestFetchedAt = stats.fetchedAt;
      statsFetched += 1;
      const curated = extractSofaScoreCuratedStats(stats.payload);
      const sourceUrl = `${BASE}/event/${match.event.id}/statistics`;
      const upsert = await db.from("sports_editorial_source_evidence").upsert({
        fixture_id: match.fixture.id,
        briefing_date: date,
        source_kind: "SOFASCORE",
        source_name: "SofaScore",
        source_url: sourceUrl,
        source_event_id: String(match.event.id),
        evidence_type: "MATCH_STATS",
        title: `${match.fixture.home} x ${match.fixture.away} — estatísticas`,
        body: null,
        payload: {
          curated,
          providerEvent: {
            id: match.event.id,
            home: match.event.home,
            away: match.event.away,
            kickoffAt: match.event.kickoffAt,
            homeScore: match.event.homeScore,
            awayScore: match.event.awayScore,
          },
          rawStatistics: stats.payload,
        },
        published_at: null,
        fetched_at: stats.fetchedAt,
        confidence: Math.min(0.99, Number(match.score.toFixed(3))),
        metadata: {
          matching: {
            canonicalHome: match.fixture.home,
            canonicalAway: match.fixture.away,
            score: Number(match.score.toFixed(3)),
          },
          timezone: TIME_ZONE,
        },
      }, { onConflict: "fixture_id,source_kind,evidence_type,source_event_id" });
      if (upsert.error) throw new Error(upsert.error.message);
      evidenceUpserted += 1;
    } catch (error) {
      failedStats += 1;
      console.warn("[sofascore-editorial-sync] stats failed", match.fixture.id, error);
    }
    await new Promise((resolve) => setTimeout(resolve, REQUEST_GAP_MS));
  }

  const result: SofaScoreEditorialSyncResult = {
    date,
    sourceUrl: `${BASE}/sport/football/scheduled-events/${date}`,
    scheduledEvents: events.length,
    canonicalCandidates: fixtures.length,
    matchedFixtures: matched.length,
    statsFetched,
    evidenceUpserted,
    unmatchedFixtures: Math.max(0, fixtures.length - matched.length - ambiguousFixtures),
    ambiguousFixtures,
    failedStats,
    fetchedAt: latestFetchedAt,
  };

  const state = await db.from("sports_sync_state").upsert({
    provider: "sofascore",
    domain: "editorial_match_stats",
    season: "2026/27",
    cursor_value: date,
    last_attempt_at: latestFetchedAt,
    last_success_at: failedStats === 0 && evidenceUpserted > 0 ? latestFetchedAt : null,
    last_error: evidenceUpserted === 0
      ? "Nenhuma evidência SofaScore foi persistida."
      : failedStats > 0
        ? `${failedStats} consulta(s) de estatísticas falharam.`
        : null,
    metadata: result,
    updated_at: latestFetchedAt,
  }, { onConflict: "provider,domain,season" });
  if (state.error) throw new Error(`Falha ao persistir estado SofaScore: ${state.error.message}`);

  return result;
}
