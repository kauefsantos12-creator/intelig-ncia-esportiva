import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { adminDb } from "./admin-db";
import { BackendError } from "./backend-contract";

type DbError = { message: string } | null;
type DbResponse = { data: unknown; error: DbError };

interface NewsQuery extends PromiseLike<DbResponse> {
  select(columns?: string): NewsQuery;
  eq(column: string, value: unknown): NewsQuery;
  gte(column: string, value: unknown): NewsQuery;
  order(column: string, options?: Record<string, unknown>): NewsQuery;
  limit(value: number): NewsQuery;
  maybeSingle(): NewsQuery;
}

interface NewsDb {
  from(table: string): NewsQuery;
  rpc(functionName: string, args?: Record<string, unknown>): PromiseLike<DbResponse>;
}

export type NewsSourceLink = {
  label: string;
  url: string;
};

export type NewsBriefingItem = {
  id: string;
  fixtureId: string | null;
  kind: "FOOTBALL_MATCH" | "ELO_MOVE" | "OTHER_SPORT" | "NEWS_CONTEXT" | "UNKNOWN";
  title: string;
  body: string | null;
  priority: number;
  lateGame: boolean;
  sources: NewsSourceLink[];
};

export type NewsBriefing = {
  id: string;
  date: string;
  footballSummary: string | null;
  otherSportsSummary: string | null;
  factsThrough: string | null;
  generatedAt: string | null;
  items: NewsBriefingItem[];
};

export type NewsResult = {
  id: string;
  kickoffAt: string;
  competitionId: string;
  competition: string;
  competitionKind: string;
  divisionLevel: number | null;
  countryCode: string | null;
  region: string | null;
  homeTeam: string;
  homeTeamLogo: string | null;
  awayTeam: string;
  awayTeamLogo: string | null;
  homeGoals: number;
  awayGoals: number;
};

export type EloMovement = {
  fixtureId: number | null;
  kickoffAt: string;
  competition: string;
  team: string;
  opponent: string;
  ratingBefore: number;
  ratingAfter: number;
  delta: number;
  goalsFor: number | null;
  goalsAgainst: number | null;
};

export type NewsOverview = {
  briefing: NewsBriefing | null;
  recentResults: NewsResult[];
  eloMovements: EloMovement[];
  observedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function parseSourceLinks(value: unknown): NewsSourceLink[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const links: NewsSourceLink[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const role = text(entry["role"]);
    if (role !== "journalism_context" && role !== "other_sport_editorial") continue;
    const label = text(entry["source"]);
    const url = text(entry["sourceUrl"]);
    if (!label || !url || !/^https:\/\//i.test(url) || seen.has(url)) continue;
    seen.add(url);
    links.push({ label, url });
  }
  return links.slice(0, 3);
}

function numeric(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBriefingItem(row: Record<string, unknown>): NewsBriefingItem | null {
  const id = text(row["id"]);
  const title = text(row["title"]);
  if (!id || !title) return null;
  const rawKind = text(row["item_kind"]) ?? "UNKNOWN";
  const kind: NewsBriefingItem["kind"] =
    rawKind === "FOOTBALL_MATCH" || rawKind === "ELO_MOVE" || rawKind === "OTHER_SPORT" || rawKind === "NEWS_CONTEXT"
      ? rawKind
      : "UNKNOWN";
  return {
    id,
    fixtureId: text(row["fixture_id"]),
    kind,
    title,
    body: text(row["body"]),
    priority: numeric(row["priority"]) ?? 0,
    lateGame: isRecord(row["facts"]) && row["facts"]["lateGame"] === true,
    sources: parseSourceLinks(row["provenance"]),
  };
}

function parseResult(row: Record<string, unknown>): NewsResult | null {
  const id = text(row["fixture_id"]);
  const kickoffAt = text(row["kickoff_at"]);
  const competitionId = text(row["competition_id"]);
  const competition = text(row["competition"]);
  const competitionKind = text(row["competition_kind"]);
  const homeTeam = text(row["home_team"]);
  const awayTeam = text(row["away_team"]);
  const homeGoals = numeric(row["home_goals"]);
  const awayGoals = numeric(row["away_goals"]);

  if (!id || !kickoffAt || !competitionId || !competition || !competitionKind || !homeTeam || !awayTeam || homeGoals === null || awayGoals === null) {
    return null;
  }

  return {
    id,
    kickoffAt,
    competitionId,
    competition,
    competitionKind,
    divisionLevel: numeric(row["division_level"]),
    countryCode: text(row["country_code"]),
    region: text(row["region"]),
    homeTeam,
    homeTeamLogo: text(row["home_team_logo"]),
    awayTeam,
    awayTeamLogo: text(row["away_team_logo"]),
    homeGoals,
    awayGoals,
  };
}

function parseEloMovement(row: Record<string, unknown>): EloMovement | null {
  const kickoffAt = text(row["kickoff_at"]);
  const competition = text(row["league_name"]);
  const team = text(row["team_name"]);
  const opponent = text(row["opponent_name"]);
  const fixtureId = numeric(row["fixture_id"]);
  const ratingBefore = numeric(row["rating_before"]);
  const ratingAfter = numeric(row["rating_after"]);
  const delta = numeric(row["delta"]);

  if (!kickoffAt || !competition || !team || !opponent || ratingBefore === null || ratingAfter === null || delta === null) {
    return null;
  }

  return {
    fixtureId,
    kickoffAt,
    competition,
    team,
    opponent,
    ratingBefore,
    ratingAfter,
    delta,
    goalsFor: numeric(row["goals_for"]),
    goalsAgainst: numeric(row["goals_against"]),
  };
}

export const getNewsOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NewsOverview> => {
    if (!context.userId) {
      throw new BackendError("UNAUTHENTICATED", "Faça login para continuar.", 401);
    }

    const db = (await adminDb()) as unknown as NewsDb;
    const observedAt = new Date();
    const since = new Date(observedAt.getTime() - 48 * 60 * 60 * 1000).toISOString();

    const [briefingResult, resultsResult, eloResult] = await Promise.all([
      db
        .from("sports_daily_briefings")
        .select("id,briefing_date,football_summary,other_sports_summary,facts_through,generated_at")
        .eq("status", "PUBLISHED")
        .order("briefing_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      db.rpc("get_recent_priority_results", {
        p_since: since,
        p_limit: 12,
      }),
      db.rpc("get_recent_elo_movements", {
        p_since: since,
        p_limit: 8,
      }),
    ]);

    if (briefingResult.error) {
      throw new BackendError("INTERNAL_ERROR", "Falha ao carregar a resenha esportiva.", 500);
    }
    if (resultsResult.error) {
      throw new BackendError("INTERNAL_ERROR", "Falha ao carregar os resultados recentes.", 500);
    }
    if (eloResult.error) {
      throw new BackendError("INTERNAL_ERROR", "Falha ao carregar os movimentos de Elo.", 500);
    }

    let briefing: NewsBriefing | null = null;
    if (isRecord(briefingResult.data)) {
      const id = text(briefingResult.data["id"]);
      const date = text(briefingResult.data["briefing_date"]);
      if (id && date) {
        const itemsResult = await db
          .from("sports_briefing_items")
          .select("id,briefing_id,fixture_id,item_kind,title,body,priority,facts,provenance")
          .eq("briefing_id", id)
          .order("priority", { ascending: false })
          .order("created_at", { ascending: true })
          .limit(100);

        if (itemsResult.error) {
          throw new BackendError("INTERNAL_ERROR", "Falha ao carregar os itens da resenha esportiva.", 500);
        }

        briefing = {
          id,
          date,
          footballSummary: text(briefingResult.data["football_summary"]),
          otherSportsSummary: text(briefingResult.data["other_sports_summary"]),
          factsThrough: text(briefingResult.data["facts_through"]),
          generatedAt: text(briefingResult.data["generated_at"]),
          items: records(itemsResult.data).map(parseBriefingItem).filter((item): item is NewsBriefingItem => item !== null),
        };
      }
    }

    const recentResults = records(resultsResult.data)
      .map(parseResult)
      .filter((result): result is NewsResult => result !== null);

    return {
      briefing,
      recentResults,
      eloMovements: records(eloResult.data)
        .map(parseEloMovement)
        .filter((movement): movement is EloMovement => movement !== null),
      observedAt: observedAt.toISOString(),
    };
  });
