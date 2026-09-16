import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { adminDb } from "./admin-db";
import { BackendError } from "./backend-contract";

type DbError = { message: string } | null;
type DbResponse = { data: unknown; error: DbError };

interface AnalyticsQuery extends PromiseLike<DbResponse> {
  select(columns?: string): AnalyticsQuery;
  eq(column: string, value: unknown): AnalyticsQuery;
  in(column: string, values: readonly unknown[]): AnalyticsQuery;
  or(filters: string): AnalyticsQuery;
  order(column: string, options?: Record<string, unknown>): AnalyticsQuery;
  limit(value: number): AnalyticsQuery;
}

interface AnalyticsDb {
  from(table: string): AnalyticsQuery;
}

export type AnalyticsCompetition = {
  id: string;
  name: string;
  countryCode: string | null;
  region: string | null;
  kind: string;
  divisionLevel: number | null;
  season: string;
};

export type AnalyticsStanding = {
  competitionId: string;
  season: string;
  teamId: string;
  teamName: string;
  shortName: string | null;
  logoUrl: string | null;
  position: number | null;
  played: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  points: number | null;
  form: string | null;
  provider: string;
  fetchedAt: string;
};

export type AnalyticsDirectory = {
  season: string;
  generatedAt: string;
  competitions: AnalyticsCompetition[];
  standings: AnalyticsStanding[];
};

export type AnalyticsPlayer = {
  id: string;
  name: string;
  nationality: string | null;
  photoUrl: string | null;
  jerseyNumber: number | null;
  position: string | null;
  appearances: number | null;
  starts: number | null;
  minutes: number | null;
  providerRating: number | null;
};

export type AnalyticsFixture = {
  id: string;
  kickoffAt: string;
  status: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  homeGoals: number | null;
  awayGoals: number | null;
};

export type AnalyticsTeamDetail = {
  competitionId: string;
  teamId: string;
  season: string;
  players: AnalyticsPlayer[];
  fixtures: AnalyticsFixture[];
};

const teamDetailInput = z.object({
  competitionId: z.string().uuid(),
  teamId: z.string().uuid(),
  season: z.string().min(4).max(16).default("2026/27"),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function numeric(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCompetition(row: Record<string, unknown>): AnalyticsCompetition | null {
  const id = text(row["id"]);
  const name = text(row["name"]);
  const kind = text(row["competition_kind"]);
  const season = text(row["season"]);
  if (!id || !name || !kind || !season) return null;
  return {
    id,
    name,
    countryCode: text(row["country_code"]),
    region: text(row["region"]),
    kind,
    divisionLevel: numeric(row["division_level"]),
    season,
  };
}

function parseStanding(
  row: Record<string, unknown>,
  teams: Map<string, Record<string, unknown>>,
): AnalyticsStanding | null {
  const competitionId = text(row["competition_id"]);
  const season = text(row["season"]);
  const teamId = text(row["team_id"]);
  const provider = text(row["provider"]);
  const fetchedAt = text(row["fetched_at"]);
  const team = teamId ? teams.get(teamId) : undefined;
  const teamName = team ? text(team["name"]) : null;
  if (!competitionId || !season || !teamId || !provider || !fetchedAt || !teamName) return null;
  return {
    competitionId,
    season,
    teamId,
    teamName,
    shortName: team ? text(team["short_name"]) : null,
    logoUrl: team ? text(team["logo_url"]) : null,
    position: numeric(row["position"]),
    played: numeric(row["played"]),
    wins: numeric(row["wins"]),
    draws: numeric(row["draws"]),
    losses: numeric(row["losses"]),
    goalsFor: numeric(row["goals_for"]),
    goalsAgainst: numeric(row["goals_against"]),
    points: numeric(row["points"]),
    form: text(row["form"]),
    provider,
    fetchedAt,
  };
}

function parseFixture(row: Record<string, unknown>, teamNames: Map<string, string>): AnalyticsFixture | null {
  const id = text(row["id"]);
  const kickoffAt = text(row["kickoff_at"]);
  const status = text(row["status"]);
  const homeTeamId = text(row["home_team_id"]);
  const awayTeamId = text(row["away_team_id"]);
  if (!id || !kickoffAt || !status || !homeTeamId || !awayTeamId) return null;
  return {
    id,
    kickoffAt,
    status,
    homeTeamId,
    homeTeamName: teamNames.get(homeTeamId) ?? "Equipe",
    awayTeamId,
    awayTeamName: teamNames.get(awayTeamId) ?? "Equipe",
    homeGoals: numeric(row["home_goals"]),
    awayGoals: numeric(row["away_goals"]),
  };
}

export const getAnalyticsDirectory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AnalyticsDirectory> => {
    if (!context.userId) {
      throw new BackendError("UNAUTHENTICATED", "Faça login para continuar.", 401);
    }

    const db = (await adminDb()) as unknown as AnalyticsDb;
    const season = "2026/27";
    const standingsResult = await db
      .from("sports_standings")
      .select("competition_id,season,team_id,provider,position,played,wins,draws,losses,goals_for,goals_against,points,form,fetched_at")
      .eq("season", season)
      .order("fetched_at", { ascending: false })
      .limit(5000);

    if (standingsResult.error) {
      throw new BackendError("INTERNAL_ERROR", "Falha ao carregar os dados de temporada do Analytics.", 500);
    }

    const standingRows = records(standingsResult.data);
    const competitionIds = Array.from(new Set(standingRows.map((row) => text(row["competition_id"])).filter((id): id is string => Boolean(id))));
    const teamIds = Array.from(new Set(standingRows.map((row) => text(row["team_id"])).filter((id): id is string => Boolean(id))));

    const competitionsPromise = competitionIds.length
      ? db
          .from("sports_competitions")
          .select("id,name,country_code,region,competition_kind,division_level,season")
          .in("id", competitionIds)
          .eq("active", true)
          .limit(500)
      : Promise.resolve({ data: [], error: null } satisfies DbResponse);
    const teamsPromise = teamIds.length
      ? db.from("sports_teams").select("id,name,short_name,logo_url").in("id", teamIds).limit(5000)
      : Promise.resolve({ data: [], error: null } satisfies DbResponse);

    const [competitionsResult, teamsResult] = await Promise.all([competitionsPromise, teamsPromise]);
    if (competitionsResult.error || teamsResult.error) {
      throw new BackendError("INTERNAL_ERROR", "Falha ao carregar o catálogo analítico da temporada.", 500);
    }

    const teams = new Map(records(teamsResult.data).map((row) => [text(row["id"]) ?? "", row] as const));
    const seen = new Set<string>();
    const standings = standingRows
      .map((row) => parseStanding(row, teams))
      .filter((row): row is AnalyticsStanding => row !== null)
      .filter((row) => {
        const key = `${row.competitionId}:${row.teamId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER));

    return {
      season,
      generatedAt: new Date().toISOString(),
      competitions: records(competitionsResult.data)
        .map(parseCompetition)
        .filter((row): row is AnalyticsCompetition => row !== null)
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
      standings,
    };
  });

export const getAnalyticsTeamDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => teamDetailInput.parse(input))
  .handler(async ({ data, context }): Promise<AnalyticsTeamDetail> => {
    if (!context.userId) {
      throw new BackendError("UNAUTHENTICATED", "Faça login para continuar.", 401);
    }

    const db = (await adminDb()) as unknown as AnalyticsDb;
    const [squadResult, statsResult, fixturesResult] = await Promise.all([
      db
        .from("sports_team_squads")
        .select("player_id,jersey_number,position,provider,fetched_at")
        .eq("team_id", data.teamId)
        .eq("season", data.season)
        .eq("active", true)
        .order("fetched_at", { ascending: false })
        .limit(300),
      db
        .from("sports_player_season_stats")
        .select("player_id,appearances,starts,minutes,provider_rating,provider,fetched_at")
        .eq("team_id", data.teamId)
        .eq("competition_id", data.competitionId)
        .eq("season", data.season)
        .order("fetched_at", { ascending: false })
        .limit(300),
      db
        .from("sports_fixtures")
        .select("id,kickoff_at,status,home_team_id,away_team_id,home_goals,away_goals")
        .eq("competition_id", data.competitionId)
        .eq("season", data.season)
        .or(`home_team_id.eq.${data.teamId},away_team_id.eq.${data.teamId}`)
        .order("kickoff_at", { ascending: false })
        .limit(80),
    ]);

    if (squadResult.error || statsResult.error || fixturesResult.error) {
      throw new BackendError("INTERNAL_ERROR", "Falha ao carregar o detalhamento analítico da equipe.", 500);
    }

    const squadRows = records(squadResult.data);
    const statRows = records(statsResult.data);
    const fixtureRows = records(fixturesResult.data);
    const playerIds = Array.from(new Set([...squadRows, ...statRows].map((row) => text(row["player_id"])).filter((id): id is string => Boolean(id))));
    const fixtureTeamIds = Array.from(new Set(fixtureRows.flatMap((row) => [text(row["home_team_id"]), text(row["away_team_id"])]).filter((id): id is string => Boolean(id))));

    const playersPromise = playerIds.length
      ? db.from("sports_players").select("id,name,nationality,photo_url").in("id", playerIds).limit(500)
      : Promise.resolve({ data: [], error: null } satisfies DbResponse);
    const teamsPromise = fixtureTeamIds.length
      ? db.from("sports_teams").select("id,name").in("id", fixtureTeamIds).limit(500)
      : Promise.resolve({ data: [], error: null } satisfies DbResponse);
    const [playersResult, teamsResult] = await Promise.all([playersPromise, teamsPromise]);

    if (playersResult.error || teamsResult.error) {
      throw new BackendError("INTERNAL_ERROR", "Falha ao carregar nomes e elenco da equipe.", 500);
    }

    const playersById = new Map(records(playersResult.data).map((row) => [text(row["id"]) ?? "", row] as const));
    const latestSquad = new Map<string, Record<string, unknown>>();
    for (const row of squadRows) {
      const playerId = text(row["player_id"]);
      if (playerId && !latestSquad.has(playerId)) latestSquad.set(playerId, row);
    }
    const latestStats = new Map<string, Record<string, unknown>>();
    for (const row of statRows) {
      const playerId = text(row["player_id"]);
      if (playerId && !latestStats.has(playerId)) latestStats.set(playerId, row);
    }

    const players: AnalyticsPlayer[] = playerIds
      .map((playerId) => {
        const player = playersById.get(playerId);
        const squad = latestSquad.get(playerId);
        const stats = latestStats.get(playerId);
        const name = player ? text(player["name"]) : null;
        if (!name) return null;
        return {
          id: playerId,
          name,
          nationality: player ? text(player["nationality"]) : null,
          photoUrl: player ? text(player["photo_url"]) : null,
          jerseyNumber: squad ? numeric(squad["jersey_number"]) : null,
          position: squad ? text(squad["position"]) : null,
          appearances: stats ? numeric(stats["appearances"]) : null,
          starts: stats ? numeric(stats["starts"]) : null,
          minutes: stats ? numeric(stats["minutes"]) : null,
          providerRating: stats ? numeric(stats["provider_rating"]) : null,
        } satisfies AnalyticsPlayer;
      })
      .filter((player): player is AnalyticsPlayer => player !== null)
      .sort((a, b) => (b.minutes ?? -1) - (a.minutes ?? -1) || a.name.localeCompare(b.name, "pt-BR"));

    const teamNames = new Map(
      records(teamsResult.data)
        .map((row) => [text(row["id"]), text(row["name"])] as const)
        .filter((entry): entry is readonly [string, string] => Boolean(entry[0] && entry[1])),
    );

    return {
      competitionId: data.competitionId,
      teamId: data.teamId,
      season: data.season,
      players,
      fixtures: fixtureRows.map((row) => parseFixture(row, teamNames)).filter((row): row is AnalyticsFixture => row !== null),
    };
  });
