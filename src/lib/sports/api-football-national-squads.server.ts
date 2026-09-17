import { apiFootballGet } from "@/lib/adapters/api_football.server";
import {
  apiFootballTeamSquad,
  extractApiFootballResponse,
  type ApiFootballSquad,
} from "@/lib/adapters/api_football.players.server";

import { sportsDb } from "./sports-db.server";

type Row = Record<string, unknown>;

type ApiLeagueTeam = {
  team?: {
    id?: number;
    name?: string;
    code?: string | null;
    country?: string | null;
    logo?: string | null;
  };
};

export type NationalLeagueTarget = {
  leagueId: number;
  name: string;
  countryCode: string;
  region: "EUROPE" | "SOUTH_AMERICA";
};

export const NATIONAL_LEAGUE_TARGETS: readonly NationalLeagueTarget[] = [
  { leagueId: 39, name: "English Premier League", countryCode: "GB-ENG", region: "EUROPE" },
  { leagueId: 61, name: "France Ligue 1", countryCode: "FR", region: "EUROPE" },
  { leagueId: 78, name: "Germany Bundesliga", countryCode: "DE", region: "EUROPE" },
  { leagueId: 135, name: "Italy Serie A", countryCode: "IT", region: "EUROPE" },
  { leagueId: 140, name: "Spain La Liga", countryCode: "ES", region: "EUROPE" },
  { leagueId: 71, name: "Brazil Serie A", countryCode: "BR", region: "SOUTH_AMERICA" },
] as const;

const SEASON = "2026/27";
const API_SEASON = 2026;
const SQUAD_FRESHNESS_MS = 7 * 24 * 60 * 60 * 1000;

function record(value: unknown): Row | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Row : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function squadBucket(now = new Date()) {
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = monday.getUTCDay() || 7;
  monday.setUTCDate(monday.getUTCDate() - day + 1);
  return monday.toISOString().slice(0, 10);
}

async function competitionForLeague(db: Awaited<ReturnType<typeof sportsDb>>, target: NationalLeagueTarget) {
  const result = await db.from("sports_competitions")
    .select("id")
    .eq("api_football_league_id", target.leagueId)
    .eq("season", SEASON)
    .eq("active", true)
    .limit(1);
  if (result.error || !result.data?.length) {
    throw new Error(`Competição canônica ausente para ${target.name} (${target.leagueId}).`);
  }
  return String((result.data[0] as Row)["id"]);
}

async function upsertTeam(
  db: Awaited<ReturnType<typeof sportsDb>>,
  rawTeam: NonNullable<ApiLeagueTeam["team"]>,
  target: NationalLeagueTarget,
) {
  const apiTeamId = numberValue(rawTeam.id);
  const name = text(rawTeam.name);
  if (apiTeamId === null || !name) return null;

  const byApi = await db.from("sports_teams")
    .select("id")
    .eq("api_football_team_id", apiTeamId)
    .limit(1);
  if (byApi.error) throw new Error(`Falha ao localizar time API-Football ${apiTeamId}: ${byApi.error.message}`);

  let teamId: string | null = byApi.data?.length ? String((byApi.data[0] as Row)["id"]) : null;

  if (!teamId) {
    const byName = await db.from("sports_teams")
      .select("id,api_football_team_id")
      .eq("name", name)
      .limit(2);
    if (byName.error) throw new Error(`Falha ao localizar time por nome ${name}: ${byName.error.message}`);
    if (byName.data?.length === 1 && numberValue((byName.data[0] as Row)["api_football_team_id"]) === null) {
      teamId = String((byName.data[0] as Row)["id"]);
    }
  }

  if (teamId) {
    const update = await db.from("sports_teams").update({
      name,
      short_name: text(rawTeam.code),
      country_code: target.countryCode,
      region: target.region,
      api_football_team_id: apiTeamId,
      logo_url: text(rawTeam.logo),
      metadata: { source: "api_football", national_catalog: true },
    }).eq("id", teamId);
    if (update.error) throw new Error(`Falha ao atualizar ${name}: ${update.error.message}`);
    return { teamId, apiTeamId, name };
  }

  const inserted = await db.from("sports_teams").insert({
    canonical_key: `api-football:${apiTeamId}`,
    name,
    short_name: text(rawTeam.code),
    country_code: target.countryCode,
    region: target.region,
    api_football_team_id: apiTeamId,
    logo_url: text(rawTeam.logo),
    metadata: { source: "api_football", national_catalog: true },
  }).select("id").single();
  if (inserted.error || !inserted.data) throw new Error(`Falha ao criar ${name}: ${inserted.error?.message ?? "sem linha"}`);
  return { teamId: String((inserted.data as Row)["id"]), apiTeamId, name };
}

async function squadIsFresh(db: Awaited<ReturnType<typeof sportsDb>>, teamId: string) {
  const result = await db.from("sports_team_squads")
    .select("fetched_at")
    .eq("team_id", teamId)
    .eq("season", SEASON)
    .eq("provider", "api_football")
    .eq("active", true)
    .order("fetched_at", { ascending: false })
    .limit(1);
  if (result.error) throw new Error(`Falha ao verificar freshness do elenco: ${result.error.message}`);
  const fetchedAt = result.data?.length ? text((result.data[0] as Row)["fetched_at"]) : null;
  return fetchedAt ? Date.now() - Date.parse(fetchedAt) < SQUAD_FRESHNESS_MS : false;
}

export async function syncNationalLeagueTeams(leagueId: number) {
  const target = NATIONAL_LEAGUE_TARGETS.find((item) => item.leagueId === leagueId);
  if (!target) throw new Error(`Liga ${leagueId} fora do escopo nacional prioritário.`);

  const fetch = await apiFootballGet(`/teams?league=${leagueId}&season=${API_SEASON}`);
  if (fetch.status !== "OK" || !fetch.payload) {
    throw new Error(fetch.errorMessage ?? `Catálogo API-Football indisponível para ${target.name}.`);
  }
  const envelope = record(fetch.payload);
  const response = Array.isArray(envelope?.["response"]) ? envelope?.["response"] as ApiLeagueTeam[] : [];
  if (!response.length) throw new Error(`API-Football retornou zero clubes para ${target.name}.`);

  const db = await sportsDb();
  const competitionId = await competitionForLeague(db, target);
  let teams = 0;
  let squadJobs = 0;
  const bucket = squadBucket();

  for (const entry of response) {
    if (!entry.team) continue;
    const team = await upsertTeam(db, entry.team, target);
    if (!team) continue;
    teams += 1;

    const membership = await db.from("sports_team_competitions").upsert({
      competition_id: competitionId,
      team_id: team.teamId,
      season: SEASON,
      provider: "api_football",
      active: true,
      fetched_at: fetch.fetchedAt,
      metadata: { api_football_league_id: leagueId },
    }, { onConflict: "competition_id,team_id,season,provider" });
    if (membership.error) throw new Error(`Falha ao vincular ${team.name} a ${target.name}: ${membership.error.message}`);

    if (!(await squadIsFresh(db, team.teamId))) {
      const enqueue = await db.rpc("enqueue_sports_job", {
        p_idempotency_key: `api-football-team-squad:${team.apiTeamId}:${bucket}`,
        p_job_type: "API_FOOTBALL_TEAM_SQUAD",
        p_fixture_id: null,
        p_payload: { teamId: team.teamId, apiTeamId: team.apiTeamId, leagueId, season: SEASON },
        p_max_attempts: 5,
      });
      if (enqueue.error) throw new Error(`Falha ao enfileirar elenco de ${team.name}: ${enqueue.error.message}`);
      squadJobs += 1;
    }
  }

  return { leagueId, competitionId, leagueName: target.name, teams, squadJobs };
}

async function upsertSquadPlayer(
  db: Awaited<ReturnType<typeof sportsDb>>,
  teamId: string,
  member: Record<string, unknown>,
  fetchedAt: string,
) {
  const apiPlayerId = numberValue(member["id"]);
  const name = text(member["name"]);
  if (apiPlayerId === null || !name) return false;

  const player = await db.from("sports_players").upsert({
    canonical_key: `api-football:${apiPlayerId}`,
    name,
    api_football_player_id: apiPlayerId,
    photo_url: text(member["photo"]),
    metadata: { source: "api_football", squad_backfill: true },
  }, { onConflict: "canonical_key" }).select("id").single();
  if (player.error || !player.data) throw new Error(`Falha ao persistir jogador ${name}: ${player.error?.message ?? "sem linha"}`);

  const row = await db.from("sports_team_squads").upsert({
    team_id: teamId,
    player_id: String((player.data as Row)["id"]),
    season: SEASON,
    provider: "api_football",
    jersey_number: numberValue(member["number"]),
    position: text(member["position"]),
    active: true,
    fetched_at: fetchedAt,
    metadata: { source: "players/squads" },
  }, { onConflict: "team_id,player_id,season,provider" });
  if (row.error) throw new Error(`Falha ao vincular jogador ${name} ao elenco: ${row.error.message}`);
  return true;
}

export async function syncNationalTeamSquad(teamId: string, expectedApiTeamId?: number) {
  const db = await sportsDb();
  if (await squadIsFresh(db, teamId)) return { teamId, status: "FRESH" as const, players: 0 };

  const teamResult = await db.from("sports_teams")
    .select("id,name,api_football_team_id")
    .eq("id", teamId)
    .single();
  if (teamResult.error || !teamResult.data) throw new Error(`Time canônico ausente: ${teamId}`);
  const team = teamResult.data as Row;
  const apiTeamId = numberValue(team["api_football_team_id"]);
  if (apiTeamId === null) throw new Error(`Time ${String(team["name"])} sem api_football_team_id.`);
  if (expectedApiTeamId !== undefined && apiTeamId !== expectedApiTeamId) {
    throw new Error(`API team id divergente para ${String(team["name"])}.`);
  }

  const fetch = await apiFootballTeamSquad(apiTeamId);
  if (fetch.status !== "OK") throw new Error(fetch.errorMessage ?? `Elenco indisponível para ${String(team["name"])}.`);
  const blocks = extractApiFootballResponse<ApiFootballSquad>(fetch);
  const members = blocks.flatMap((block) => block.players ?? []);
  if (!members.length) throw new Error(`API-Football retornou elenco vazio para ${String(team["name"])}.`);

  const deactivate = await db.from("sports_team_squads").update({ active: false })
    .eq("team_id", teamId)
    .eq("season", SEASON)
    .eq("provider", "api_football");
  if (deactivate.error) throw new Error(`Falha ao preparar atualização do elenco: ${deactivate.error.message}`);

  let players = 0;
  for (const member of members) {
    if (await upsertSquadPlayer(db, teamId, member as Record<string, unknown>, fetch.fetchedAt)) players += 1;
  }
  return { teamId, apiTeamId, status: "SYNCED" as const, players };
}
