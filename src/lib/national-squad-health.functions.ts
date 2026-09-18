import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { adminDb } from "./admin-db";
import { BackendError } from "./backend-contract";

type DbError = { message: string } | null;
type DbResponse = { data: unknown; error: DbError };

interface HealthQuery extends PromiseLike<DbResponse> {
  select(columns?: string): HealthQuery;
  eq(column: string, value: unknown): HealthQuery;
  in(column: string, values: readonly unknown[]): HealthQuery;
  order(column: string, options?: Record<string, unknown>): HealthQuery;
  limit(value: number): HealthQuery;
}

interface HealthDb {
  from(table: string): HealthQuery;
}

type Row = Record<string, unknown>;

const SEASON = "2026/27";
const FRESHNESS_MS = 7 * 24 * 60 * 60 * 1000;
const ACTIVE_JOB_STATUSES = new Set(["PENDING", "RUNNING", "FAILED"]);

const NATIONAL_LEAGUES = [
  { leagueId: 39, leagueName: "Premier League" },
  { leagueId: 61, leagueName: "Ligue 1" },
  { leagueId: 71, leagueName: "Brasileirão" },
  { leagueId: 78, leagueName: "Bundesliga" },
  { leagueId: 135, leagueName: "Serie A" },
  { leagueId: 140, leagueName: "La Liga" },
] as const;

export type NationalSquadQuotaState = "OK" | "RATE_LIMIT" | "DAILY_LIMIT";

export type NationalSquadLeagueHealth = {
  leagueId: number;
  leagueName: string;
  competitionId: string | null;
  currentClubs: number;
  mappedApiIds: number;
  squadsLoaded: number;
  squadsFresh: number;
  pendingJobs: number;
  deadJobs: number;
  catalogStatus: string;
  quotaState: NationalSquadQuotaState;
  retryAt: string | null;
  lastError: string | null;
};

export type NationalSquadHealth = {
  season: string;
  generatedAt: string;
  leagues: NationalSquadLeagueHealth[];
  totals: {
    currentClubs: number;
    mappedApiIds: number;
    squadsLoaded: number;
    squadsFresh: number;
    pendingJobs: number;
    deadJobs: number;
  };
};

function isRecord(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function records(value: unknown): Row[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function numeric(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function payloadLeagueId(row: Row) {
  const payload = isRecord(row["payload"]) ? row["payload"] : null;
  return numeric(payload?.["leagueId"]);
}

function isRateLimitError(message: string | null) {
  return Boolean(message && /(rate limit|too many requests|quota|exceeded.*limit|limit.*requests)/i.test(message));
}

function isDailyLimitError(message: string | null) {
  return Boolean(message && /(daily|per day|day quota|daily quota)/i.test(message));
}

function earliestIso(values: Array<string | null>) {
  const valid = values
    .filter((value): value is string => Boolean(value) && Number.isFinite(Date.parse(value!)))
    .sort((a, b) => Date.parse(a) - Date.parse(b));
  return valid[0] ?? null;
}

export const getNationalSquadHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NationalSquadHealth> => {
    if (!context.userId) {
      throw new BackendError("UNAUTHENTICATED", "Faça login para continuar.", 401);
    }

    const db = (await adminDb()) as unknown as HealthDb;
    const leagueIds = NATIONAL_LEAGUES.map((league) => league.leagueId);

    const [competitionsResult, membershipsResult, squadsResult, jobsResult] = await Promise.all([
      db
        .from("sports_competitions")
        .select("id,name,api_football_league_id")
        .eq("season", SEASON)
        .eq("active", true)
        .in("api_football_league_id", leagueIds)
        .limit(50),
      db
        .from("sports_team_competitions")
        .select("competition_id,team_id,fetched_at")
        .eq("season", SEASON)
        .eq("provider", "five_dollar")
        .eq("active", true)
        .limit(1000),
      db
        .from("sports_team_squads")
        .select("team_id,fetched_at")
        .eq("season", SEASON)
        .eq("active", true)
        .limit(5000),
      db
        .from("sports_jobs")
        .select("job_type,payload,status,attempts,max_attempts,available_at,last_error,created_at,completed_at")
        .in("job_type", ["API_FOOTBALL_LEAGUE_TEAMS", "API_FOOTBALL_TEAM_SQUAD"])
        .order("created_at", { ascending: false })
        .limit(5000),
    ]);

    if (competitionsResult.error || membershipsResult.error || squadsResult.error || jobsResult.error) {
      throw new BackendError("INTERNAL_ERROR", "Falha ao calcular a saúde do catálogo nacional de elencos.", 500);
    }

    const competitionRows = records(competitionsResult.data);
    const competitionIds = new Set(competitionRows.map((row) => text(row["id"])).filter((id): id is string => Boolean(id)));
    const membershipRows = records(membershipsResult.data).filter((row) => {
      const competitionId = text(row["competition_id"]);
      return Boolean(competitionId && competitionIds.has(competitionId));
    });
    const teamIds = [...new Set(membershipRows.map((row) => text(row["team_id"])).filter((id): id is string => Boolean(id)))];
    const teamsResult = teamIds.length
      ? await db.from("sports_teams").select("id,api_football_team_id").in("id", teamIds).limit(1000)
      : ({ data: [], error: null } satisfies DbResponse);

    if (teamsResult.error) {
      throw new BackendError("INTERNAL_ERROR", "Falha ao calcular a reconciliação de IDs dos clubes.", 500);
    }

    const teamsById = new Map(records(teamsResult.data).map((row) => [text(row["id"]) ?? "", row] as const));
    const squadRows = records(squadsResult.data);
    const jobRows = records(jobsResult.data);
    const now = Date.now();

    const leagues = NATIONAL_LEAGUES.map(({ leagueId, leagueName }): NationalSquadLeagueHealth => {
      const competition = competitionRows.find((row) => numeric(row["api_football_league_id"]) === leagueId) ?? null;
      const competitionId = competition ? text(competition["id"]) : null;
      const memberships = competitionId
        ? membershipRows.filter((row) => text(row["competition_id"]) === competitionId)
        : [];
      const currentTeamIds = new Set(memberships.map((row) => text(row["team_id"])).filter((id): id is string => Boolean(id)));
      const mappedApiIds = [...currentTeamIds].filter((teamId) => numeric(teamsById.get(teamId)?.["api_football_team_id"]) !== null).length;

      const loadedTeams = new Set<string>();
      const freshTeams = new Set<string>();
      for (const squad of squadRows) {
        const teamId = text(squad["team_id"]);
        if (!teamId || !currentTeamIds.has(teamId)) continue;
        loadedTeams.add(teamId);
        const fetchedAt = text(squad["fetched_at"]);
        if (fetchedAt && Number.isFinite(Date.parse(fetchedAt)) && now - Date.parse(fetchedAt) <= FRESHNESS_MS) {
          freshTeams.add(teamId);
        }
      }

      const jobs = jobRows.filter((row) => payloadLeagueId(row) === leagueId);
      const catalogJob = jobs.find((row) => text(row["job_type"]) === "API_FOOTBALL_LEAGUE_TEAMS") ?? null;
      const activeJobs = jobs.filter((row) => ACTIVE_JOB_STATUSES.has(text(row["status"]) ?? ""));
      const deadJobs = jobs.filter((row) => text(row["status"]) === "DEAD").length;
      const rateLimitedJobs = activeJobs.filter((row) => isRateLimitError(text(row["last_error"])));
      const quotaState: NationalSquadQuotaState = rateLimitedJobs.some((row) => isDailyLimitError(text(row["last_error"])))
        ? "DAILY_LIMIT"
        : rateLimitedJobs.length
          ? "RATE_LIMIT"
          : "OK";
      const retryAt = earliestIso(rateLimitedJobs.map((row) => text(row["available_at"])));
      const lastRateError = rateLimitedJobs.find((row) => text(row["last_error"])) ?? null;

      return {
        leagueId,
        leagueName: competition ? text(competition["name"]) ?? leagueName : leagueName,
        competitionId,
        currentClubs: currentTeamIds.size,
        mappedApiIds,
        squadsLoaded: loadedTeams.size,
        squadsFresh: freshTeams.size,
        pendingJobs: activeJobs.length,
        deadJobs,
        catalogStatus: catalogJob ? text(catalogJob["status"]) ?? "UNKNOWN" : "NOT_ENQUEUED",
        quotaState,
        retryAt,
        lastError: lastRateError ? text(lastRateError["last_error"]) : null,
      };
    });

    return {
      season: SEASON,
      generatedAt: new Date().toISOString(),
      leagues,
      totals: leagues.reduce(
        (totals, league) => ({
          currentClubs: totals.currentClubs + league.currentClubs,
          mappedApiIds: totals.mappedApiIds + league.mappedApiIds,
          squadsLoaded: totals.squadsLoaded + league.squadsLoaded,
          squadsFresh: totals.squadsFresh + league.squadsFresh,
          pendingJobs: totals.pendingJobs + league.pendingJobs,
          deadJobs: totals.deadJobs + league.deadJobs,
        }),
        { currentClubs: 0, mappedApiIds: 0, squadsLoaded: 0, squadsFresh: 0, pendingJobs: 0, deadJobs: 0 },
      ),
    };
  });
