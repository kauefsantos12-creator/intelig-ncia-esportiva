import { apiFootballGet } from "@/lib/adapters/api_football.server";
import {
  apiFootballTeamSquad,
  extractApiFootballResponse,
  type ApiFootballSquad,
} from "@/lib/adapters/api_football.players.server";
import { fiveDollarGet } from "@/lib/adapters/five_dollar.server";

import { sportsDb } from "./sports-db.server";

type Row = Record<string, unknown>;

type ApiCountryTeam = {
  team?: {
    id?: number;
    name?: string;
    code?: string | null;
    country?: string | null;
    logo?: string | null;
  };
};

type FiveDollarStandingTeam = {
  id: number;
  name: string;
};

export type NationalLeagueTarget = {
  leagueId: number;
  fiveDollarLeagueId: number;
  name: string;
  countryCode: string;
  apiCountry: string;
  region: "EUROPE" | "SOUTH_AMERICA";
};

export const NATIONAL_LEAGUE_TARGETS: readonly NationalLeagueTarget[] = [
  { leagueId: 39, fiveDollarLeagueId: 4160026622, name: "English Premier League", countryCode: "GB-ENG", apiCountry: "England", region: "EUROPE" },
  { leagueId: 61, fiveDollarLeagueId: 3614399544, name: "France Ligue 1", countryCode: "FR", apiCountry: "France", region: "EUROPE" },
  { leagueId: 78, fiveDollarLeagueId: 686337048, name: "Germany Bundesliga", countryCode: "DE", apiCountry: "Germany", region: "EUROPE" },
  { leagueId: 135, fiveDollarLeagueId: 3405541143, name: "Italy Serie A", countryCode: "IT", apiCountry: "Italy", region: "EUROPE" },
  { leagueId: 140, fiveDollarLeagueId: 4212821298, name: "Spain La Liga", countryCode: "ES", apiCountry: "Spain", region: "EUROPE" },
  { leagueId: 71, fiveDollarLeagueId: 3118717965, name: "Brazil Serie A", countryCode: "BR", apiCountry: "Brazil", region: "SOUTH_AMERICA" },
] as const;

const SEASON = "2026/27";
const SQUAD_FRESHNESS_MS = 7 * 24 * 60 * 60 * 1000;

function record(value: unknown): Row | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Row : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeTeamName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(fc|cf|ac|sc|afc|ssc|calcio|futebol|football|club|clube)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function teamTokens(value: string) {
  return new Set(normalizeTeamName(value).split(" ").filter(Boolean));
}

export function teamNameScore(left: string, right: string) {
  const a = normalizeTeamName(left);
  const b = normalizeTeamName(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return Math.min(a.length, b.length) / Math.max(a.length, b.length);
  const at = teamTokens(a);
  const bt = teamTokens(b);
  const intersection = [...at].filter((token) => bt.has(token)).length;
  const union = new Set([...at, ...bt]).size;
  return union ? intersection / union : 0;
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

function parseFiveDollarStandingTeams(payload: unknown): FiveDollarStandingTeam[] {
  const root = record(payload);
  const data = record(root?.["data"]);
  const table = Array.isArray(data?.["table"]) ? data["table"] as unknown[] : [];
  const result = new Map<number, FiveDollarStandingTeam>();
  for (const raw of table) {
    const row = record(raw);
    const team = record(row?.["team"]);
    const id = numberValue(team?.["id"]);
    const name = text(team?.["name"]);
    if (id !== null && name) result.set(id, { id, name });
  }
  return [...result.values()];
}

function parseApiCountryTeams(payload: unknown): ApiCountryTeam[] {
  const root = record(payload);
  return Array.isArray(root?.["response"]) ? root["response"] as ApiCountryTeam[] : [];
}

function bestApiTeamMatch(team: FiveDollarStandingTeam, candidates: ApiCountryTeam[]) {
  const ranked = candidates
    .filter((entry) => entry.team?.id && entry.team.name)
    .map((entry) => ({ entry, score: teamNameScore(team.name, String(entry.team!.name)) }))
    .sort((a, b) => b.score - a.score);
  if (!ranked.length || ranked[0]!.score < 0.72) return null;
  if (ranked[1] && ranked[0]!.score - ranked[1].score < 0.12) return null;
  return ranked[0]!.entry.team!;
}

async function upsertTeam(
  db: Awaited<ReturnType<typeof sportsDb>>,
  fiveDollarTeam: FiveDollarStandingTeam,
  apiTeam: NonNullable<ApiCountryTeam["team"]> | null,
  target: NationalLeagueTarget,
) {
  const apiTeamId = apiTeam ? numberValue(apiTeam.id) : null;
  const byFiveDollar = await db.from("sports_teams")
    .select("id,api_football_team_id")
    .eq("five_dollar_team_id", fiveDollarTeam.id)
    .limit(1);
  if (byFiveDollar.error) throw new Error(`Falha ao localizar time 5Dollar ${fiveDollarTeam.id}: ${byFiveDollar.error.message}`);

  let teamId: string | null = byFiveDollar.data?.length ? String((byFiveDollar.data[0] as Row)["id"]) : null;

  if (!teamId && apiTeamId !== null) {
    const byApi = await db.from("sports_teams").select("id").eq("api_football_team_id", apiTeamId).limit(1);
    if (byApi.error) throw new Error(`Falha ao localizar time API-Football ${apiTeamId}: ${byApi.error.message}`);
    if (byApi.data?.length) teamId = String((byApi.data[0] as Row)["id"]);
  }

  if (!teamId) {
    const byName = await db.from("sports_teams").select("id").eq("name", fiveDollarTeam.name).limit(2);
    if (byName.error) throw new Error(`Falha ao localizar ${fiveDollarTeam.name}: ${byName.error.message}`);
    if (byName.data?.length === 1) teamId = String((byName.data[0] as Row)["id"]);
  }

  const patch = {
    name: fiveDollarTeam.name,
    short_name: apiTeam ? text(apiTeam.code) : null,
    country_code: target.countryCode,
    region: target.region,
    five_dollar_team_id: fiveDollarTeam.id,
    api_football_team_id: apiTeamId,
    logo_url: apiTeam ? text(apiTeam.logo) : null,
    metadata: { source: "national_catalog", five_dollar_league_id: target.fiveDollarLeagueId, api_match_score: apiTeam ? teamNameScore(fiveDollarTeam.name, String(apiTeam.name)) : null },
  };

  if (teamId) {
    const update = await db.from("sports_teams").update(patch).eq("id", teamId);
    if (update.error) throw new Error(`Falha ao atualizar ${fiveDollarTeam.name}: ${update.error.message}`);
    return { teamId, apiTeamId, name: fiveDollarTeam.name };
  }

  const inserted = await db.from("sports_teams").insert({
    canonical_key: `five-dollar:${fiveDollarTeam.id}`,
    ...patch,
  }).select("id").single();
  if (inserted.error || !inserted.data) throw new Error(`Falha ao criar ${fiveDollarTeam.name}: ${inserted.error?.message ?? "sem linha"}`);
  return { teamId: String((inserted.data as Row)["id"]), apiTeamId, name: fiveDollarTeam.name };
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

  const [standingsFetch, countryFetch] = await Promise.all([
    fiveDollarGet(`/standings?league=${target.fiveDollarLeagueId}`),
    apiFootballGet(`/teams?country=${encodeURIComponent(target.apiCountry)}`),
  ]);
  if (standingsFetch.status !== "OK" || !standingsFetch.payload) {
    throw new Error(standingsFetch.errorMessage ?? `Standings 5Dollar indisponíveis para ${target.name}.`);
  }
  if (countryFetch.status !== "OK" || !countryFetch.payload) {
    throw new Error(countryFetch.errorMessage ?? `Catálogo API-Football por país indisponível para ${target.name}.`);
  }

  const currentTeams = parseFiveDollarStandingTeams(standingsFetch.payload);
  const apiTeams = parseApiCountryTeams(countryFetch.payload);
  if (!currentTeams.length) throw new Error(`5Dollar retornou zero clubes atuais para ${target.name}.`);
  if (!apiTeams.length) throw new Error(`API-Football retornou zero clubes para ${target.apiCountry}.`);

  const db = await sportsDb();
  const competitionId = await competitionForLeague(db, target);
  let teams = 0;
  let mappedApiTeams = 0;
  let unmappedApiTeams = 0;
  let squadJobs = 0;
  const bucket = squadBucket();

  for (const currentTeam of currentTeams) {
    const apiTeam = bestApiTeamMatch(currentTeam, apiTeams);
    const team = await upsertTeam(db, currentTeam, apiTeam, target);
    teams += 1;
    if (team.apiTeamId !== null) mappedApiTeams += 1;
    else unmappedApiTeams += 1;

    const membership = await db.from("sports_team_competitions").upsert({
      competition_id: competitionId,
      team_id: team.teamId,
      season: SEASON,
      provider: "five_dollar",
      active: true,
      fetched_at: standingsFetch.fetchedAt,
      metadata: { five_dollar_league_id: target.fiveDollarLeagueId, api_football_league_id: leagueId },
    }, { onConflict: "competition_id,team_id,season,provider" });
    if (membership.error) throw new Error(`Falha ao vincular ${team.name} a ${target.name}: ${membership.error.message}`);

    if (team.apiTeamId !== null && !(await squadIsFresh(db, team.teamId))) {
      const enqueue = await db.rpc("enqueue_sports_job", {
        p_idempotency_key: `api-football-team-squad:${team.apiTeamId}:${bucket}`,
        p_job_type: "API_FOOTBALL_TEAM_SQUAD",
        p_fixture_id: null,
        p_payload: { teamId: team.teamId, apiTeamId: team.apiTeamId, leagueId, season: SEASON },
        p_max_attempts: 20,
      });
      if (enqueue.error) throw new Error(`Falha ao enfileirar elenco de ${team.name}: ${enqueue.error.message}`);
      squadJobs += 1;
    }
  }

  return { leagueId, competitionId, leagueName: target.name, teams, mappedApiTeams, unmappedApiTeams, squadJobs };
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
