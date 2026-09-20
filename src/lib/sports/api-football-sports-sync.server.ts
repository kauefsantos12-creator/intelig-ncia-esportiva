import { apiFootballGet, apiFootballResolveMatch } from "@/lib/adapters/api_football.server";
import {
  apiFootballFixtureInjuries,
  apiFootballFixtureLineups,
  apiFootballFixturePlayers,
  apiFootballPlayerSeason,
  apiFootballTeamSquad,
  extractApiFootballResponse,
  type ApiFootballFixtureLineup,
  type ApiFootballFixturePlayerStatistics,
} from "@/lib/adapters/api_football.players.server";
import { nullableProviderNumber } from "@/lib/domain/provider-value";
import { classifyPlayerParticipation } from "@/lib/domain/sports-intelligence-policy";
import { sportsJobIdempotencyKey } from "@/lib/domain/sports-data-contract";

import { sportsDb } from "./sports-db.server";

const SEASON = "2026/27";
const API_FOOTBALL_SEASON = 2026;

type Row = Record<string, unknown>;

function record(value: unknown): Row | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Row : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function apiFootballTeamPatch(team: Row, apiTeamId: number) {
  return {
    api_football_team_id: apiTeamId,
    ...(text(team["logo_url"]) ? {} : { logo_url: `https://media.api-sports.io/football/teams/${apiTeamId}.png` }),
  };
}


function nearbyIsoDates(iso: string): string[] {
  const center = new Date(iso);
  return [-1, 0, 1].map((offset) => {
    const date = new Date(center.getTime() + offset * 86_400_000);
    return date.toISOString().slice(0, 10);
  });
}

async function readFixtureContext(sportsFixtureId: string) {
  const db = await sportsDb();
  const fixtureResult = await db.from("sports_fixtures")
    .select("id,canonical_key,kickoff_at,status,competition_id,home_team_id,away_team_id,api_football_fixture_id")
    .eq("id", sportsFixtureId)
    .single();
  if (fixtureResult.error || !fixtureResult.data) throw new Error(`Fixture canônica não encontrada: ${sportsFixtureId}`);
  const fixture = fixtureResult.data as Row;
  const ids = [String(fixture["home_team_id"]), String(fixture["away_team_id"])];
  const [teamsResult, competitionResult] = await Promise.all([
    db.from("sports_teams").select("id,name,api_football_team_id,logo_url").in("id", ids),
    db.from("sports_competitions").select("id,name,api_football_league_id").eq("id", String(fixture["competition_id"])).single(),
  ]);
  if (teamsResult.error || !teamsResult.data || teamsResult.data.length !== 2) throw new Error("Equipes canônicas da fixture não foram encontradas.");
  if (competitionResult.error || !competitionResult.data) throw new Error("Competição canônica da fixture não foi encontrada.");
  const teams = teamsResult.data as Row[];
  const home = teams.find((team) => String(team["id"]) === String(fixture["home_team_id"]));
  const away = teams.find((team) => String(team["id"]) === String(fixture["away_team_id"]));
  if (!home || !away) throw new Error("Mandante/visitante não puderam ser resolvidos.");
  return { db, fixture, home, away, competition: competitionResult.data as Row };
}

export interface ApiFootballLinkResult {
  fixtureId: string;
  status: "LINKED" | "ALREADY_LINKED" | "NOT_FOUND" | "UNAVAILABLE";
  apiFixtureId: number | null;
  confidence: number | null;
  detail: string;
}

export async function linkApiFootballFixture(
  sportsFixtureId: string,
  options: { enqueueFixtureData?: boolean } = {},
): Promise<ApiFootballLinkResult> {
  const context = await readFixtureContext(sportsFixtureId);
  const existing = nullableProviderNumber(context.fixture["api_football_fixture_id"]);
  if (existing !== null) {
    return { fixtureId: sportsFixtureId, status: "ALREADY_LINKED", apiFixtureId: existing, confidence: 1, detail: "Vínculo já persistido." };
  }

  const kickoffAt = String(context.fixture["kickoff_at"]);
  const query = {
    homeTeam: String(context.home["name"]),
    awayTeam: String(context.away["name"]),
    competition: String(context.competition["name"]),
    kickoff: kickoffAt,
  };

  for (const date of nearbyIsoDates(kickoffAt)) {
    const resolved = await apiFootballResolveMatch(query, date);
    if (resolved.fetch.status === "NOT_CONFIGURED") {
      return { fixtureId: sportsFixtureId, status: "UNAVAILABLE", apiFixtureId: null, confidence: null, detail: resolved.fetch.errorMessage ?? "API-Football não configurada." };
    }
    if (resolved.fetch.status !== "OK") continue;
    if (resolved.resolution?.status !== "MATCH_RESOLVED" || resolved.resolution.eventId === null) continue;
    const event = resolved.events.find((candidate) => candidate.eventId === resolved.resolution?.eventId);
    if (!event) continue;

    const raw = await apiFootballGet(`/fixtures?id=${event.eventId}`);
    let apiLeagueId: number | null = null;
    if (raw.status === "OK" && raw.payload) {
      const root = record(raw.payload);
      const response = Array.isArray(root?.["response"]) ? root?.["response"] as unknown[] : [];
      apiLeagueId = nullableProviderNumber(record(record(response[0])?.["league"])?.["id"]);
    }

    const updateFixture = await context.db.from("sports_fixtures")
      .update({ api_football_fixture_id: event.eventId, updated_at: new Date().toISOString() })
      .eq("id", sportsFixtureId);
    if (updateFixture.error) throw new Error(`Falha ao salvar vínculo API-Football: ${updateFixture.error.message}`);

    const updates: PromiseLike<unknown>[] = [];
    if (event.homeTeamId !== null) updates.push(context.db.from("sports_teams").update(apiFootballTeamPatch(context.home, event.homeTeamId)).eq("id", String(context.home["id"]))) as unknown as PromiseLike<unknown>;
    if (event.awayTeamId !== null) updates.push(context.db.from("sports_teams").update(apiFootballTeamPatch(context.away, event.awayTeamId)).eq("id", String(context.away["id"]))) as unknown as PromiseLike<unknown>;
    if (apiLeagueId !== null) updates.push(context.db.from("sports_competitions").update({ api_football_league_id: apiLeagueId }).eq("id", String(context.competition["id"]))) as unknown as PromiseLike<unknown>;
    if (updates.length > 0) await Promise.all(updates);

    if (options.enqueueFixtureData !== false) {
      await context.db.rpc("enqueue_sports_job", {
        p_idempotency_key: sportsJobIdempotencyKey("api-football-fixture-data", String(context.fixture["canonical_key"])),
        p_job_type: "API_FOOTBALL_FIXTURE_DATA",
        p_fixture_id: sportsFixtureId,
        p_payload: { fixtureId: sportsFixtureId, apiFixtureId: event.eventId },
        p_max_attempts: 5,
      });
    }

    return {
      fixtureId: sportsFixtureId,
      status: "LINKED",
      apiFixtureId: event.eventId,
      confidence: resolved.resolution.confidence,
      detail: resolved.resolution.reason,
    };
  }

  return { fixtureId: sportsFixtureId, status: "NOT_FOUND", apiFixtureId: null, confidence: null, detail: "Nenhuma partida única compatível encontrada em ±1 dia." };
}

async function upsertApiPlayer(db: Awaited<ReturnType<typeof sportsDb>>, player: Row) {
  const id = nullableProviderNumber(player["id"]);
  const name = text(player["name"]);
  if (id === null || !name) return null;
  const { data, error } = await db.from("sports_players").upsert({
    canonical_key: `api-football:${id}`,
    name,
    api_football_player_id: id,
    photo_url: text(player["photo"]),
    metadata: { source: "api_football" },
  }, { onConflict: "canonical_key" }).select("id").single();
  if (error || !data) throw new Error(`Falha ao persistir jogador ${name}: ${error?.message ?? "sem linha"}`);
  return { sportsPlayerId: String((data as Row)["id"]), apiPlayerId: id, name };
}

function teamByApiId(context: Awaited<ReturnType<typeof readFixtureContext>>, apiTeamId: number | null) {
  if (apiTeamId === null) return null;
  if (nullableProviderNumber(context.home["api_football_team_id"]) === apiTeamId) return context.home;
  if (nullableProviderNumber(context.away["api_football_team_id"]) === apiTeamId) return context.away;
  return null;
}

function statPayload(stat: Row): Row {
  const copy: Row = { ...stat };
  delete copy["games"];
  return copy;
}

export interface ApiFootballFixtureSyncResult {
  fixtureId: string;
  apiFixtureId: number;
  lineups: number;
  playerStats: number;
  squadPlayers: number;
  injuries: number;
}

export async function syncApiFootballFixtureData(sportsFixtureId: string): Promise<ApiFootballFixtureSyncResult> {
  const context = await readFixtureContext(sportsFixtureId);
  const apiFixtureId = nullableProviderNumber(context.fixture["api_football_fixture_id"]);
  if (apiFixtureId === null) throw new Error("Fixture ainda não possui vínculo API-Football.");
  const matchFinished = String(context.fixture["status"]) === "FINISHED";

  const lineupsFetch = await apiFootballFixtureLineups(apiFixtureId);
  if (lineupsFetch.status !== "OK") throw new Error(lineupsFetch.errorMessage ?? "Lineups API-Football indisponíveis.");
  const lineups = extractApiFootballResponse<ApiFootballFixtureLineup>(lineupsFetch);
  const starterApiIds = new Set<number>();
  let lineupCount = 0;

  for (const lineup of lineups) {
    const localTeam = teamByApiId(context, nullableProviderNumber(lineup.team?.id));
    if (!localTeam) continue;
    const teamId = String(localTeam["id"]);
    for (const [entries, isStarting] of [[lineup.startXI ?? [], true], [lineup.substitutes ?? [], false]] as const) {
      for (const entry of entries) {
        const rawPlayer = record(entry.player);
        if (!rawPlayer) continue;
        const player = await upsertApiPlayer(context.db, rawPlayer);
        if (!player) continue;
        if (isStarting) starterApiIds.add(player.apiPlayerId);
        const result = await context.db.from("sports_fixture_lineups").upsert({
          fixture_id: sportsFixtureId,
          team_id: teamId,
          player_id: player.sportsPlayerId,
          provider: "api_football",
          is_starting: isStarting,
          is_substitute: !isStarting,
          position: text(rawPlayer["pos"]),
          grid_position: text(rawPlayer["grid"]),
          jersey_number: nullableProviderNumber(rawPlayer["number"]),
          formation: lineup.formation ?? null,
          fetched_at: lineupsFetch.fetchedAt,
          metadata: {},
        }, { onConflict: "fixture_id,team_id,player_id,provider" });
        if (result.error) throw new Error(`Falha ao persistir lineup: ${result.error.message}`);
        lineupCount += 1;
      }
    }
  }

  const playersFetch = await apiFootballFixturePlayers(apiFixtureId);
  if (playersFetch.status !== "OK") throw new Error(playersFetch.errorMessage ?? "Player stats API-Football indisponíveis.");
  const teamBlocks = extractApiFootballResponse<ApiFootballFixturePlayerStatistics>(playersFetch);
  let playerStatsCount = 0;
  for (const block of teamBlocks) {
    const localTeam = teamByApiId(context, nullableProviderNumber(block.team?.id));
    if (!localTeam) continue;
    for (const entry of block.players ?? []) {
      const rawPlayer = record(entry.player);
      if (!rawPlayer) continue;
      const player = await upsertApiPlayer(context.db, rawPlayer);
      const stat = record(entry.statistics?.[0]);
      if (!player || !stat) continue;
      const games = record(stat["games"]);
      const minutes = nullableProviderNumber(games?.["minutes"]);
      const participation = classifyPlayerParticipation({
        minutes,
        inStartingXI: starterApiIds.has(player.apiPlayerId),
        listedAsSubstitute: games?.["substitute"] === true,
        matchFinished,
      });
      const result = await context.db.from("sports_fixture_player_stats").upsert({
        fixture_id: sportsFixtureId,
        team_id: String(localTeam["id"]),
        player_id: player.sportsPlayerId,
        provider: "api_football",
        participation_state: participation,
        minutes,
        provider_rating: nullableProviderNumber(games?.["rating"]),
        stats: statPayload(stat),
        fetched_at: playersFetch.fetchedAt,
      }, { onConflict: "fixture_id,player_id,provider" });
      if (result.error) throw new Error(`Falha ao persistir player stats: ${result.error.message}`);
      playerStatsCount += 1;
    }
  }

  let squadPlayers = 0;
  for (const localTeam of [context.home, context.away]) {
    const apiTeamId = nullableProviderNumber(localTeam["api_football_team_id"]);
    if (apiTeamId === null) continue;
    const squadFetch = await apiFootballTeamSquad(apiTeamId);
    if (squadFetch.status !== "OK") continue;
    const squads = extractApiFootballResponse(squadFetch);
    for (const squadRaw of squads) {
      const squad = record(squadRaw);
      const members = Array.isArray(squad?.["players"]) ? squad?.["players"] as unknown[] : [];
      for (const memberRaw of members) {
        const member = record(memberRaw);
        if (!member) continue;
        const player = await upsertApiPlayer(context.db, member);
        if (!player) continue;
        const result = await context.db.from("sports_team_squads").upsert({
          team_id: String(localTeam["id"]),
          player_id: player.sportsPlayerId,
          season: SEASON,
          provider: "api_football",
          jersey_number: nullableProviderNumber(member["number"]),
          position: text(member["position"]),
          active: true,
          fetched_at: squadFetch.fetchedAt,
          metadata: {},
        }, { onConflict: "team_id,player_id,season,provider" });
        if (result.error) throw new Error(`Falha ao persistir elenco: ${result.error.message}`);
        squadPlayers += 1;
      }
    }
  }

  const injuriesFetch = await apiFootballFixtureInjuries(apiFixtureId);
  let injuries = 0;
  if (injuriesFetch.status === "OK") {
    for (const injuryRaw of extractApiFootballResponse(injuriesFetch)) {
      const injury = record(injuryRaw);
      const rawPlayer = record(injury?.["player"]);
      const rawTeam = record(injury?.["team"]);
      if (!injury || !rawPlayer) continue;
      const player = await upsertApiPlayer(context.db, rawPlayer);
      if (!player) continue;
      const localTeam = teamByApiId(context, nullableProviderNumber(rawTeam?.["id"]));
      const result = await context.db.from("sports_injuries").insert({
        fixture_id: sportsFixtureId,
        team_id: localTeam ? String(localTeam["id"]) : null,
        player_id: player.sportsPlayerId,
        provider: "api_football",
        injury_type: text(rawPlayer["type"]),
        reason: text(rawPlayer["reason"]),
        fetched_at: injuriesFetch.fetchedAt,
        metadata: injury,
      });
      if (!result.error) injuries += 1;
    }
  }

  return { fixtureId: sportsFixtureId, apiFixtureId, lineups: lineupCount, playerStats: playerStatsCount, squadPlayers, injuries };
}

export async function syncApiFootballPlayerSeason(
  sportsPlayerId: string,
  sportsTeamId: string,
  sportsCompetitionId: string,
) {
  const db = await sportsDb();
  const [playerResult, teamResult, competitionResult] = await Promise.all([
    db.from("sports_players").select("id,api_football_player_id").eq("id", sportsPlayerId).single(),
    db.from("sports_teams").select("id,api_football_team_id").eq("id", sportsTeamId).single(),
    db.from("sports_competitions").select("id,api_football_league_id").eq("id", sportsCompetitionId).single(),
  ]);
  const player = playerResult.data as Row | null;
  const team = teamResult.data as Row | null;
  const competition = competitionResult.data as Row | null;
  const apiPlayerId = nullableProviderNumber(player?.["api_football_player_id"]);
  const apiTeamId = nullableProviderNumber(team?.["api_football_team_id"]);
  const apiLeagueId = nullableProviderNumber(competition?.["api_football_league_id"]);
  if (apiPlayerId === null || apiTeamId === null || apiLeagueId === null) throw new Error("Mapeamento API-Football incompleto para player season.");

  const response = await apiFootballPlayerSeason(apiPlayerId, apiLeagueId, API_FOOTBALL_SEASON);
  if (response.status !== "OK" || !response.payload) throw new Error(response.errorMessage ?? "Player season indisponível.");
  const root = record(response.payload);
  const list = Array.isArray(root?.["response"]) ? root?.["response"] as unknown[] : [];
  const item = record(list[0]);
  const statistics = Array.isArray(item?.["statistics"]) ? item?.["statistics"] as unknown[] : [];
  const matching = statistics.map(record).find((stat) => nullableProviderNumber(record(stat?.["team"])?.["id"]) === apiTeamId) ?? record(statistics[0]);
  if (!matching) return { persisted: false, reason: "Sem estatísticas de temporada para a combinação solicitada." };
  const games = record(matching["games"]);
  const substitutes = record(matching["substitutes"]);
  const result = await db.from("sports_player_season_stats").upsert({
    player_id: sportsPlayerId,
    team_id: sportsTeamId,
    competition_id: sportsCompetitionId,
    season: SEASON,
    provider: "api_football",
    appearances: nullableProviderNumber(games?.["appearences"] ?? games?.["appearances"]),
    starts: nullableProviderNumber(games?.["lineups"]),
    minutes: nullableProviderNumber(games?.["minutes"]),
    provider_rating: nullableProviderNumber(games?.["rating"]),
    stats: { ...matching, substitutes },
    fetched_at: response.fetchedAt,
  }, { onConflict: "player_id,team_id,competition_id,season,provider" });
  if (result.error) throw new Error(`Falha ao persistir player season: ${result.error.message}`);
  return { persisted: true, fetchedAt: response.fetchedAt };
}
