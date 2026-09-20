import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { adminDb } from "./admin-db";
import { BackendError } from "./backend-contract";

const historyInputSchema = z.object({
  teamId: z.number().int().positive(),
  days: z.number().int().min(7).max(180).default(60),
});

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export const getEloDirectory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!context.userId) {
      throw new BackendError("UNAUTHENTICATED", "Faça login para continuar.", 401);
    }

    const db = await adminDb();
    const [teamsResult, leaguesResult, syncResult, teamMediaResult] = await Promise.all([
      db
        .from("elo_global_team_ratings")
        .select(
          "team_model_version,league_id,league_key,league_name,team_id,team_name,local_rating,league_rating,global_rating,matches_processed,first_fixture_at,last_fixture_at,updated_at",
        )
        .order("global_rating", { ascending: false })
        .limit(3000),
      db
        .from("elo_league_ratings")
        .select(
          "model_version,league_id,league_key,league_name,country_code,region,division_level,focus_role,prior_rating,rating,evidence_adjustment,evidence_matches,hierarchy_constrained,updated_at",
        )
        .order("rating", { ascending: false })
        .limit(500),
      db
        .from("elo_sync_state")
        .select("last_completed_at,last_status,details")
        .eq("id", "main")
        .maybeSingle(),
      db
        .from("sports_teams")
        .select("five_dollar_team_id,logo_url")
        .limit(3000),
    ]);

    if (teamsResult.error) {
      throw new BackendError("INTERNAL_ERROR", "Falha ao carregar o ranking Elo de clubes.", 500);
    }
    if (leaguesResult.error) {
      throw new BackendError("INTERNAL_ERROR", "Falha ao carregar o ranking Elo de ligas.", 500);
    }
    if (syncResult.error) {
      throw new BackendError("INTERNAL_ERROR", "Falha ao carregar a referência temporal do Elo.", 500);
    }

    const leagueById = new Map(
      (leaguesResult.data ?? []).map((league) => [league.league_id, league] as const),
    );
    const logoByTeamId = new Map<number, string>();
    if (!teamMediaResult.error) {
      for (const row of teamMediaResult.data ?? []) {
        if (row.five_dollar_team_id === null || !row.logo_url) continue;
        if (!logoByTeamId.has(row.five_dollar_team_id)) {
          logoByTeamId.set(row.five_dollar_team_id, row.logo_url);
        }
      }
    }

    const teams = (teamsResult.data ?? []).map((team) => {
      const league = team.league_id === null ? undefined : leagueById.get(team.league_id);
      return {
        ...team,
        countryCode: league?.country_code ?? null,
        region: league?.region ?? null,
        divisionLevel: league?.division_level ?? null,
        logoUrl: team.team_id === null ? null : logoByTeamId.get(team.team_id) ?? null,
      };
    });

    const syncDetails = asRecord(syncResult.data?.details);
    const audit = asRecord(syncDetails?.["audit"]);
    const summary = asRecord(audit?.["summary"]);
    const latestFixtureFromTeams = teams.reduce<string | null>((latest, team) => {
      const candidate = team.last_fixture_at;
      if (!candidate) return latest;
      if (!latest || Date.parse(candidate) > Date.parse(latest)) return candidate;
      return latest;
    }, null);

    return {
      teams,
      leagues: leaguesResult.data ?? [],
      requestedAt: new Date().toISOString(),
      snapshot: {
        status: syncResult.data?.last_status ?? "UNKNOWN",
        completedAt: syncResult.data?.last_completed_at ?? null,
        latestTeamFixtureAt: asString(summary?.["latestTeamFixture"]) ?? latestFixtureFromTeams,
        domesticCurrent: asNumber(syncDetails?.["domesticCurrent"]),
        domesticTargets: asNumber(syncDetails?.["domesticTargets"]),
        crossCurrent: asNumber(syncDetails?.["crossCurrent"]),
        crossTargets: asNumber(syncDetails?.["crossTargets"]),
        cadence: "DAILY_0505_AMERICA_SAO_PAULO" as const,
      },
      definitions: {
        currentTeamRating: "global_rating = local_rating + ajuste da força da liga em relação ao baseline do modelo.",
        historyScope: "O histórico por partida abaixo usa o rating local da equipe registrado em elo_fixture_history.",
      },
    };
  });

export const getTeamEloHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => historyInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!context.userId) {
      throw new BackendError("UNAUTHENTICATED", "Faça login para continuar.", 401);
    }

    const since = new Date(Date.now() - data.days * 86_400_000).toISOString();
    const db = await adminDb();
    const { data: rows, error } = await db
      .from("elo_fixture_history")
      .select(
        "model_version,league_id,league_name,fixture_id,kickoff_at,home_team_id,home_team_name,away_team_id,away_team_name,home_goals,away_goals,home_rating_before,away_rating_before,home_rating_after,away_rating_after,elo_delta",
      )
      .gte("kickoff_at", since)
      .or(`home_team_id.eq.${data.teamId},away_team_id.eq.${data.teamId}`)
      .order("kickoff_at", { ascending: true })
      .limit(500);

    if (error) {
      throw new BackendError("INTERNAL_ERROR", "Falha ao carregar o histórico Elo da equipe.", 500);
    }

    const history = (rows ?? []).map((row) => {
      const isHome = row.home_team_id === data.teamId;
      const ratingBefore = isHome ? row.home_rating_before : row.away_rating_before;
      const ratingAfter = isHome ? row.home_rating_after : row.away_rating_after;
      return {
        fixtureId: row.fixture_id,
        kickoffAt: row.kickoff_at,
        leagueId: row.league_id,
        leagueName: row.league_name,
        modelVersion: row.model_version,
        teamId: data.teamId,
        teamName: isHome ? row.home_team_name : row.away_team_name,
        opponentId: isHome ? row.away_team_id : row.home_team_id,
        opponentName: isHome ? row.away_team_name : row.home_team_name,
        venue: isHome ? ("HOME" as const) : ("AWAY" as const),
        goalsFor: isHome ? row.home_goals : row.away_goals,
        goalsAgainst: isHome ? row.away_goals : row.home_goals,
        ratingBefore,
        ratingAfter,
        delta: ratingAfter - ratingBefore,
      };
    });

    const current = history.at(-1)?.ratingAfter ?? null;
    const reference = history[0]?.ratingBefore ?? null;
    const ratings = history.flatMap((row) => [row.ratingBefore, row.ratingAfter]);

    return {
      teamId: data.teamId,
      days: data.days,
      ratingScope: "LOCAL" as const,
      history,
      summary: {
        matches: history.length,
        current,
        reference,
        delta: current === null || reference === null ? null : current - reference,
        minimum: ratings.length ? Math.min(...ratings) : null,
        maximum: ratings.length ? Math.max(...ratings) : null,
      },
    };
  });
