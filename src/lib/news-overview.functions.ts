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

type TrackingRule = {
  competitionId: string | null;
  countryCode: string | null;
  region: string | null;
  competitionKind: string | null;
  divisionLevel: number | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function relation(value: unknown): Record<string, unknown> | null {
  if (isRecord(value)) return value;
  if (Array.isArray(value) && isRecord(value[0])) return value[0];
  return null;
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
  const home = relation(row["home_team"]);
  const away = relation(row["away_team"]);
  const competition = relation(row["competition"]);
  const id = text(row["id"]);
  const kickoffAt = text(row["kickoff_at"]);
  const competitionId = competition ? text(competition["id"]) : null;
  const competitionName = competition ? text(competition["name"]) : null;
  const competitionKind = competition ? text(competition["competition_kind"]) : null;
  const homeTeam = home ? text(home["name"]) : null;
  const awayTeam = away ? text(away["name"]) : null;
  const homeGoals = numeric(row["home_goals"]);
  const awayGoals = numeric(row["away_goals"]);
  if (!id || !kickoffAt || !competitionId || !competitionName || !competitionKind || !homeTeam || !awayTeam || homeGoals === null || awayGoals === null) return null;

  return {
    id,
    kickoffAt,
    competitionId,
    competition: competitionName,
    competitionKind,
    divisionLevel: competition ? numeric(competition["division_level"]) : null,
    countryCode: competition ? text(competition["country_code"]) : null,
    region: competition ? text(competition["region"]) : null,
    homeTeam,
    homeTeamLogo: home ? text(home["logo_url"]) : null,
    awayTeam,
    awayTeamLogo: away ? text(away["logo_url"]) : null,
    homeGoals,
    awayGoals,
  };
}

function parseTrackingRule(row: Record<string, unknown>): TrackingRule {
  return {
    competitionId: text(row["competition_id"]),
    countryCode: text(row["country_code"]),
    region: text(row["region"]),
    competitionKind: text(row["competition_kind"]),
    divisionLevel: numeric(row["division_level"]),
  };
}

function matchesTrackingRule(result: NewsResult, rule: TrackingRule) {
  if (rule.competitionId) return rule.competitionId === result.competitionId;
  return (
    (!rule.countryCode || rule.countryCode === result.countryCode) &&
    (!rule.region || rule.region === result.region) &&
    (!rule.competitionKind || rule.competitionKind === result.competitionKind) &&
    (rule.divisionLevel === null || rule.divisionLevel === result.divisionLevel)
  );
}

function parseEloMovements(rows: Record<string, unknown>[]): EloMovement[] {
  const movements: EloMovement[] = [];

  for (const row of rows) {
    const kickoffAt = text(row["kickoff_at"]);
    const competition = text(row["league_name"]);
    const homeTeam = text(row["home_team_name"]);
    const awayTeam = text(row["away_team_name"]);
    const fixtureId = numeric(row["fixture_id"]);
    const homeBefore = numeric(row["home_rating_before"]);
    const homeAfter = numeric(row["home_rating_after"]);
    const awayBefore = numeric(row["away_rating_before"]);
    const awayAfter = numeric(row["away_rating_after"]);
    const homeGoals = numeric(row["home_goals"]);
    const awayGoals = numeric(row["away_goals"]);

    if (!kickoffAt || !competition || !homeTeam || !awayTeam || homeBefore === null || homeAfter === null || awayBefore === null || awayAfter === null) {
      continue;
    }

    movements.push({
      fixtureId,
      kickoffAt,
      competition,
      team: homeTeam,
      opponent: awayTeam,
      ratingBefore: homeBefore,
      ratingAfter: homeAfter,
      delta: homeAfter - homeBefore,
      goalsFor: homeGoals,
      goalsAgainst: awayGoals,
    });
    movements.push({
      fixtureId,
      kickoffAt,
      competition,
      team: awayTeam,
      opponent: homeTeam,
      ratingBefore: awayBefore,
      ratingAfter: awayAfter,
      delta: awayAfter - awayBefore,
      goalsFor: awayGoals,
      goalsAgainst: homeGoals,
    });
  }

  return movements
    .filter((movement) => Math.abs(movement.delta) >= 2)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 8);
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

    const [briefingResult, resultsResult, trackingRulesResult, eloResult] = await Promise.all([
      db
        .from("sports_daily_briefings")
        .select("id,briefing_date,football_summary,other_sports_summary,facts_through,generated_at")
        .eq("status", "PUBLISHED")
        .order("briefing_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      db
        .from("sports_fixtures")
        .select(
          "id,kickoff_at,status,home_goals,away_goals,home_team:sports_teams!sports_fixtures_home_team_id_fkey(name,logo_url),away_team:sports_teams!sports_fixtures_away_team_id_fkey(name,logo_url),competition:sports_competitions!sports_fixtures_competition_id_fkey(id,name,country_code,region,competition_kind,division_level)",
        )
        .eq("status", "FINISHED")
        .gte("kickoff_at", since)
        .order("kickoff_at", { ascending: false })
        .limit(100),
      db
        .from("sports_tracking_rules")
        .select("competition_id,country_code,region,competition_kind,division_level,priority")
        .eq("enabled", true)
        .eq("always_track", true)
        .order("priority", { ascending: false })
        .limit(100),
      db
        .from("elo_fixture_history")
        .select(
          "fixture_id,kickoff_at,league_name,home_team_name,away_team_name,home_goals,away_goals,home_rating_before,home_rating_after,away_rating_before,away_rating_after",
        )
        .gte("kickoff_at", since)
        .order("kickoff_at", { ascending: false })
        .limit(100),
    ]);

    if (briefingResult.error) {
      throw new BackendError("INTERNAL_ERROR", "Falha ao carregar a resenha esportiva.", 500);
    }
    if (resultsResult.error || trackingRulesResult.error) {
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

    const trackingRules = records(trackingRulesResult.data).map(parseTrackingRule);
    const recentResults = records(resultsResult.data)
      .map(parseResult)
      .filter((result): result is NewsResult => result !== null)
      .filter((result) => trackingRules.some((rule) => matchesTrackingRule(result, rule)))
      .slice(0, 12);

    return {
      briefing,
      recentResults,
      eloMovements: parseEloMovements(records(eloResult.data)),
      observedAt: observedAt.toISOString(),
    };
  });
