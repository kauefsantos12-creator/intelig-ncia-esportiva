import {
  apiFootballFixturePlayers,
  extractApiFootballResponse,
  type ApiFootballFixturePlayerStatistics,
} from "@/lib/adapters/api_football.players.server";
import { nullableProviderNumber } from "@/lib/domain/provider-value";
import { classifyPlayerParticipation } from "@/lib/domain/sports-intelligence-policy";

import {
  syncApiFootballFixtureData,
  type ApiFootballFixtureSyncResult,
} from "./api-football-sports-sync.server";
import { sportsDb } from "./sports-db.server";

type Row = Record<string, unknown>;

export type ApiFootballEnrichmentMode = "FREE_LEAN" | "FULL";

export interface ApiFootballQuotaSyncResult extends ApiFootballFixtureSyncResult {
  enrichmentMode: ApiFootballEnrichmentMode;
}

function record(value: unknown): Row | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Row : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function enrichmentMode(db: Awaited<ReturnType<typeof sportsDb>>): Promise<ApiFootballEnrichmentMode> {
  const result = await db.from("external_api_status_snapshots")
    .select("plan")
    .eq("provider", "api_football")
    .maybeSingle();
  const plan = text((result.data as Row | null)?.["plan"]);
  if (!plan || plan.toLowerCase() === "free") return "FREE_LEAN";
  return "FULL";
}

async function readLeanContext(sportsFixtureId: string) {
  const db = await sportsDb();
  const fixtureResult = await db.from("sports_fixtures")
    .select("id,kickoff_at,status,home_team_id,away_team_id,api_football_fixture_id")
    .eq("id", sportsFixtureId)
    .single();
  if (fixtureResult.error || !fixtureResult.data) {
    throw new Error(`Fixture canônica não encontrada: ${sportsFixtureId}`);
  }
  const fixture = fixtureResult.data as Row;
  const teamIds = [String(fixture["home_team_id"]), String(fixture["away_team_id"])];
  const teamsResult = await db.from("sports_teams")
    .select("id,api_football_team_id")
    .in("id", teamIds);
  if (teamsResult.error || !teamsResult.data || teamsResult.data.length !== 2) {
    throw new Error("Equipes canônicas da fixture não foram encontradas.");
  }
  return { db, fixture, teams: teamsResult.data as Row[] };
}

function localTeamFor(context: Awaited<ReturnType<typeof readLeanContext>>, apiTeamId: number | null) {
  if (apiTeamId === null) return null;
  return context.teams.find((team) => nullableProviderNumber(team["api_football_team_id"]) === apiTeamId) ?? null;
}

async function upsertPlayer(db: Awaited<ReturnType<typeof sportsDb>>, rawPlayer: Row) {
  const apiPlayerId = nullableProviderNumber(rawPlayer["id"]);
  const name = text(rawPlayer["name"]);
  if (apiPlayerId === null || !name) return null;
  const result = await db.from("sports_players").upsert({
    canonical_key: `api-football:${apiPlayerId}`,
    name,
    api_football_player_id: apiPlayerId,
    photo_url: text(rawPlayer["photo"]),
    metadata: { source: "api_football", enrichment_mode: "FREE_LEAN" },
  }, { onConflict: "canonical_key" }).select("id").single();
  if (result.error || !result.data) {
    throw new Error(`Falha ao persistir jogador ${name}: ${result.error?.message ?? "sem linha"}`);
  }
  return { sportsPlayerId: String((result.data as Row)["id"]), apiPlayerId };
}

function statPayload(stat: Row): Row {
  const copy = { ...stat };
  delete copy["games"];
  return copy;
}

async function syncFreeLean(sportsFixtureId: string): Promise<ApiFootballQuotaSyncResult> {
  const context = await readLeanContext(sportsFixtureId);
  const apiFixtureId = nullableProviderNumber(context.fixture["api_football_fixture_id"]);
  if (apiFixtureId === null) throw new Error("Fixture ainda não possui vínculo API-Football.");

  const kickoffAt = Date.parse(String(context.fixture["kickoff_at"]));
  const matchFinished = String(context.fixture["status"]) === "FINISHED"
    || (Number.isFinite(kickoffAt) && Date.now() >= kickoffAt + 3 * 60 * 60 * 1000);

  const playersFetch = await apiFootballFixturePlayers(apiFixtureId);
  if (playersFetch.status !== "OK") {
    throw new Error(playersFetch.errorMessage ?? "Player stats API-Football indisponíveis.");
  }
  const teamBlocks = extractApiFootballResponse<ApiFootballFixturePlayerStatistics>(playersFetch);
  if (teamBlocks.length === 0) {
    throw new Error("API-Football sem player stats pós-jogo; enriquecimento será tentado novamente.");
  }

  let lineupCount = 0;
  let playerStatsCount = 0;
  for (const block of teamBlocks) {
    const localTeam = localTeamFor(context, nullableProviderNumber(block.team?.id));
    if (!localTeam) continue;
    const sportsTeamId = String(localTeam["id"]);

    for (const entry of block.players ?? []) {
      const rawPlayer = record(entry.player);
      const stat = record(entry.statistics?.[0]);
      if (!rawPlayer || !stat) continue;
      const player = await upsertPlayer(context.db, rawPlayer);
      if (!player) continue;

      const games = record(stat["games"]);
      const minutes = nullableProviderNumber(games?.["minutes"]);
      const substituteFlag = games?.["substitute"];
      const isSubstitute = substituteFlag === true;
      const isStarting = substituteFlag === false;
      const participation = classifyPlayerParticipation({
        minutes,
        inStartingXI: isStarting,
        listedAsSubstitute: isSubstitute,
        matchFinished,
      });

      const lineupResult = await context.db.from("sports_fixture_lineups").upsert({
        fixture_id: sportsFixtureId,
        team_id: sportsTeamId,
        player_id: player.sportsPlayerId,
        provider: "api_football",
        is_starting: isStarting,
        is_substitute: isSubstitute,
        position: text(games?.["position"]),
        grid_position: null,
        jersey_number: nullableProviderNumber(games?.["number"]),
        formation: null,
        fetched_at: playersFetch.fetchedAt,
        metadata: { source_endpoint: "fixtures/players", enrichment_mode: "FREE_LEAN" },
      }, { onConflict: "fixture_id,team_id,player_id,provider" });
      if (lineupResult.error) throw new Error(`Falha ao persistir lineup econômico: ${lineupResult.error.message}`);
      lineupCount += 1;

      const statsResult = await context.db.from("sports_fixture_player_stats").upsert({
        fixture_id: sportsFixtureId,
        team_id: sportsTeamId,
        player_id: player.sportsPlayerId,
        provider: "api_football",
        participation_state: participation,
        minutes,
        provider_rating: nullableProviderNumber(games?.["rating"]),
        stats: statPayload(stat),
        fetched_at: playersFetch.fetchedAt,
      }, { onConflict: "fixture_id,player_id,provider" });
      if (statsResult.error) throw new Error(`Falha ao persistir player stats: ${statsResult.error.message}`);
      playerStatsCount += 1;
    }
  }

  if (playerStatsCount === 0) {
    throw new Error("API-Football retornou a fixture sem estatísticas de jogadores persistíveis.");
  }

  return {
    fixtureId: sportsFixtureId,
    apiFixtureId,
    lineups: lineupCount,
    playerStats: playerStatsCount,
    squadPlayers: 0,
    injuries: 0,
    enrichmentMode: "FREE_LEAN",
  };
}

export async function syncApiFootballFixtureDataQuotaAware(
  sportsFixtureId: string,
): Promise<ApiFootballQuotaSyncResult> {
  const db = await sportsDb();
  const mode = await enrichmentMode(db);
  if (mode === "FREE_LEAN") return syncFreeLean(sportsFixtureId);
  const result = await syncApiFootballFixtureData(sportsFixtureId);
  return { ...result, enrichmentMode: "FULL" };
}
