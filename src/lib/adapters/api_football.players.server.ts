import { apiFootballGet, type ApiFootballFetch } from "./api_football.server";

interface ApiFootballEnvelope<T> {
  get?: string;
  parameters?: Record<string, string | number>;
  errors?: Record<string, unknown> | unknown[];
  results?: number;
  paging?: { current?: number; total?: number };
  response?: T[];
}

export interface ApiFootballLineupPlayer {
  player?: {
    id?: number;
    name?: string;
    number?: number | null;
    pos?: string | null;
    grid?: string | null;
  };
}

export interface ApiFootballFixtureLineup {
  team?: { id?: number; name?: string; logo?: string };
  formation?: string | null;
  startXI?: ApiFootballLineupPlayer[];
  substitutes?: ApiFootballLineupPlayer[];
  coach?: { id?: number; name?: string; photo?: string };
}

export interface ApiFootballFixturePlayerStatistics {
  team?: { id?: number; name?: string; logo?: string };
  players?: Array<{
    player?: { id?: number; name?: string; photo?: string };
    statistics?: Array<{
      games?: {
        minutes?: number | null;
        number?: number | null;
        position?: string | null;
        rating?: string | number | null;
        captain?: boolean | null;
        substitute?: boolean | null;
      };
      offsides?: number | null;
      shots?: { total?: number | null; on?: number | null };
      goals?: { total?: number | null; conceded?: number | null; assists?: number | null; saves?: number | null };
      passes?: { total?: number | null; key?: number | null; accuracy?: number | string | null };
      tackles?: { total?: number | null; blocks?: number | null; interceptions?: number | null };
      duels?: { total?: number | null; won?: number | null };
      dribbles?: { attempts?: number | null; success?: number | null; past?: number | null };
      fouls?: { drawn?: number | null; committed?: number | null };
      cards?: { yellow?: number | null; red?: number | null };
      penalty?: {
        won?: number | null;
        commited?: number | null;
        scored?: number | null;
        missed?: number | null;
        saved?: number | null;
      };
    }>;
  }>;
}

export interface ApiFootballSquad {
  team?: { id?: number; name?: string; logo?: string };
  players?: Array<{
    id?: number;
    name?: string;
    age?: number | null;
    number?: number | null;
    position?: string | null;
    photo?: string | null;
  }>;
}

export async function apiFootballFixtureLineups(
  fixtureId: number,
): Promise<ApiFootballFetch<ApiFootballEnvelope<ApiFootballFixtureLineup>>> {
  return apiFootballGet(`/fixtures/lineups?fixture=${fixtureId}`);
}

export async function apiFootballFixturePlayers(
  fixtureId: number,
): Promise<ApiFootballFetch<ApiFootballEnvelope<ApiFootballFixturePlayerStatistics>>> {
  return apiFootballGet(`/fixtures/players?fixture=${fixtureId}`);
}

export async function apiFootballTeamSquad(
  teamId: number,
): Promise<ApiFootballFetch<ApiFootballEnvelope<ApiFootballSquad>>> {
  return apiFootballGet(`/players/squads?team=${teamId}`);
}

export async function apiFootballPlayerSeason(
  playerId: number,
  leagueId: number,
  season: number,
): Promise<ApiFootballFetch<ApiFootballEnvelope<unknown>>> {
  return apiFootballGet(`/players?id=${playerId}&league=${leagueId}&season=${season}`);
}

export async function apiFootballFixtureInjuries(
  fixtureId: number,
): Promise<ApiFootballFetch<ApiFootballEnvelope<unknown>>> {
  return apiFootballGet(`/injuries?fixture=${fixtureId}`);
}

export function extractApiFootballResponse<T>(
  fetch: ApiFootballFetch<ApiFootballEnvelope<T>>,
): T[] {
  if (fetch.status !== "OK" || !fetch.payload) return [];
  return Array.isArray(fetch.payload.response) ? fetch.payload.response : [];
}
