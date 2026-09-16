import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { adminDb } from "./admin-db";
import { BackendError } from "./backend-contract";

type DbError = { message: string } | null;
type DbResponse = { data: unknown; error: DbError };

interface TodayQuery extends PromiseLike<DbResponse> {
  select(columns?: string): TodayQuery;
  eq(column: string, value: unknown): TodayQuery;
  gte(column: string, value: unknown): TodayQuery;
  lt(column: string, value: unknown): TodayQuery;
  in(column: string, values: readonly unknown[]): TodayQuery;
  order(column: string, options?: Record<string, unknown>): TodayQuery;
  limit(value: number): TodayQuery;
}

interface TodayDb {
  from(table: string): TodayQuery;
}

export type BroadcastEvidence = {
  broadcaster: string;
  platform: string | null;
  sourceName: string;
  sourceUrl: string | null;
  checkedAt: string;
  confidence: number;
  isPrimary: boolean;
};

export type RecentForm = {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  sequence: Array<"W" | "D" | "L">;
};

export type TodayTeam = {
  id: string;
  name: string;
  logoUrl: string | null;
  fiveDollarTeamId: number | null;
  elo: {
    globalRating: number;
    localRating: number;
    leagueRating: number;
    matchesProcessed: number;
    updatedAt: string;
  } | null;
  recentForm: RecentForm;
};

export type TodayFixture = {
  id: string;
  kickoffAt: string;
  status: string;
  homeGoals: number | null;
  awayGoals: number | null;
  competition: {
    id: string;
    name: string;
    countryCode: string | null;
    region: string | null;
    kind: string;
    divisionLevel: number | null;
  };
  home: TodayTeam;
  away: TodayTeam;
  broadcasts: BroadcastEvidence[];
};

export type TodayOverview = {
  localDate: string;
  observedAt: string;
  fixtures: TodayFixture[];
  coverage: {
    trackedFixtures: number;
    confirmedBroadcastFixtures: number;
    eloCoveredTeams: number;
    totalTeams: number;
  };
};

type TrackingRule = {
  competitionId: string | null;
  countryCode: string | null;
  region: string | null;
  competitionKind: string | null;
  divisionLevel: number | null;
};

type RawFixture = {
  id: string;
  kickoffAt: string;
  status: string;
  homeGoals: number | null;
  awayGoals: number | null;
  competition: TodayFixture["competition"];
  home: Omit<TodayTeam, "elo" | "recentForm">;
  away: Omit<TodayTeam, "elo" | "recentForm">;
};

type EloSnapshot = NonNullable<TodayTeam["elo"]>;

type RecentFixture = {
  kickoffAt: string;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
};

const TIME_ZONE = "America/Sao_Paulo";

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

function numeric(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function boolean(value: unknown): boolean {
  return value === true;
}

function partValue(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((part) => part.type === type)?.value ?? "";
}

function localDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return `${partValue(parts, "year")}-${partValue(parts, "month")}-${partValue(parts, "day")}`;
}

function timeZoneOffsetMs(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const representedAsUtc = Date.UTC(
    Number(partValue(parts, "year")),
    Number(partValue(parts, "month")) - 1,
    Number(partValue(parts, "day")),
    Number(partValue(parts, "hour")),
    Number(partValue(parts, "minute")),
    Number(partValue(parts, "second")),
  );
  return representedAsUtc - date.getTime();
}

function parseDateKey(dateKey: string) {
  const [yearPart, monthPart, dayPart] = dateKey.split("-");
  return {
    year: Number(yearPart),
    month: Number(monthPart),
    day: Number(dayPart),
  };
}

function zonedMidnight(dateKey: string) {
  const { year, month, day } = parseDateKey(dateKey);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  return new Date(utcGuess.getTime() - timeZoneOffsetMs(utcGuess));
}

function nextDateKey(dateKey: string) {
  const { year, month, day } = parseDateKey(dateKey);
  const next = new Date(Date.UTC(year, month - 1, day + 1, 12, 0, 0));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

function parseRule(row: Record<string, unknown>): TrackingRule | null {
  if (!boolean(row["enabled"]) || !boolean(row["always_track"])) return null;
  return {
    competitionId: text(row["competition_id"]),
    countryCode: text(row["country_code"]),
    region: text(row["region"]),
    competitionKind: text(row["competition_kind"]),
    divisionLevel: numeric(row["division_level"]),
  };
}

function parseFixture(row: Record<string, unknown>): RawFixture | null {
  const competition = relation(row["competition"]);
  const home = relation(row["home_team"]);
  const away = relation(row["away_team"]);
  const id = text(row["id"]);
  const kickoffAt = text(row["kickoff_at"]);
  const status = text(row["status"]);
  const competitionId = competition ? text(competition["id"]) : null;
  const competitionName = competition ? text(competition["name"]) : null;
  const competitionKind = competition ? text(competition["competition_kind"]) : null;
  const homeId = home ? text(home["id"]) : null;
  const homeName = home ? text(home["name"]) : null;
  const awayId = away ? text(away["id"]) : null;
  const awayName = away ? text(away["name"]) : null;

  if (!id || !kickoffAt || !status || !competitionId || !competitionName || !competitionKind || !homeId || !homeName || !awayId || !awayName) {
    return null;
  }

  return {
    id,
    kickoffAt,
    status,
    homeGoals: numeric(row["home_goals"]),
    awayGoals: numeric(row["away_goals"]),
    competition: {
      id: competitionId,
      name: competitionName,
      countryCode: competition ? text(competition["country_code"]) : null,
      region: competition ? text(competition["region"]) : null,
      kind: competitionKind,
      divisionLevel: competition ? numeric(competition["division_level"]) : null,
    },
    home: {
      id: homeId,
      name: homeName,
      logoUrl: home ? text(home["logo_url"]) : null,
      fiveDollarTeamId: home ? numeric(home["five_dollar_team_id"]) : null,
    },
    away: {
      id: awayId,
      name: awayName,
      logoUrl: away ? text(away["logo_url"]) : null,
      fiveDollarTeamId: away ? numeric(away["five_dollar_team_id"]) : null,
    },
  };
}

function isTracked(fixture: RawFixture, rules: TrackingRule[]) {
  return rules.some((rule) => {
    if (rule.competitionId) return rule.competitionId === fixture.competition.id;
    return (
      (rule.countryCode === null || rule.countryCode === fixture.competition.countryCode) &&
      (rule.region === null || rule.region === fixture.competition.region) &&
      (rule.competitionKind === null || rule.competitionKind === fixture.competition.kind) &&
      (rule.divisionLevel === null || rule.divisionLevel === fixture.competition.divisionLevel)
    );
  });
}

function parseBroadcast(row: Record<string, unknown>): { fixtureId: string; evidence: BroadcastEvidence } | null {
  const fixtureId = text(row["fixture_id"]);
  const broadcaster = text(row["broadcaster"]);
  const sourceName = text(row["source_name"]);
  const checkedAt = text(row["checked_at"]);
  if (!fixtureId || !broadcaster || !sourceName || !checkedAt) return null;
  return {
    fixtureId,
    evidence: {
      broadcaster,
      platform: text(row["platform"]),
      sourceName,
      sourceUrl: text(row["source_url"]),
      checkedAt,
      confidence: numeric(row["confidence"]) ?? 0,
      isPrimary: boolean(row["is_primary"]),
    },
  };
}

function parseElo(row: Record<string, unknown>): { teamId: number; snapshot: EloSnapshot } | null {
  const teamId = numeric(row["team_id"]);
  const globalRating = numeric(row["global_rating"]);
  const localRating = numeric(row["local_rating"]);
  const leagueRating = numeric(row["league_rating"]);
  const matchesProcessed = numeric(row["matches_processed"]);
  const updatedAt = text(row["updated_at"]);
  if (teamId === null || globalRating === null || localRating === null || leagueRating === null || matchesProcessed === null || !updatedAt) return null;
  return {
    teamId,
    snapshot: {
      globalRating,
      localRating,
      leagueRating,
      matchesProcessed,
      updatedAt,
    },
  };
}

function parseRecentFixture(row: Record<string, unknown>): RecentFixture | null {
  const kickoffAt = text(row["kickoff_at"]);
  const homeTeamId = text(row["home_team_id"]);
  const awayTeamId = text(row["away_team_id"]);
  const homeGoals = numeric(row["home_goals"]);
  const awayGoals = numeric(row["away_goals"]);
  if (!kickoffAt || !homeTeamId || !awayTeamId || homeGoals === null || awayGoals === null) return null;
  return { kickoffAt, homeTeamId, awayTeamId, homeGoals, awayGoals };
}

function recentForm(teamId: string, before: string, recentFixtures: RecentFixture[]): RecentForm {
  const matches = recentFixtures
    .filter((fixture) => fixture.kickoffAt < before && (fixture.homeTeamId === teamId || fixture.awayTeamId === teamId))
    .sort((a, b) => b.kickoffAt.localeCompare(a.kickoffAt))
    .slice(0, 5);

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  const sequence: Array<"W" | "D" | "L"> = [];

  for (const fixture of matches) {
    const isHome = fixture.homeTeamId === teamId;
    const scored = isHome ? fixture.homeGoals : fixture.awayGoals;
    const conceded = isHome ? fixture.awayGoals : fixture.homeGoals;
    goalsFor += scored;
    goalsAgainst += conceded;
    if (scored > conceded) {
      wins += 1;
      sequence.push("W");
    } else if (scored === conceded) {
      draws += 1;
      sequence.push("D");
    } else {
      losses += 1;
      sequence.push("L");
    }
  }

  return { matches: matches.length, wins, draws, losses, goalsFor, goalsAgainst, sequence };
}

export const getTodayOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TodayOverview> => {
    if (!context.userId) {
      throw new BackendError("UNAUTHENTICATED", "Faça login para continuar.", 401);
    }

    const db = (await adminDb()) as unknown as TodayDb;
    const observedAt = new Date();
    const dateKey = localDateKey(observedAt);
    const start = zonedMidnight(dateKey);
    const end = zonedMidnight(nextDateKey(dateKey));

    const [rulesResult, fixturesResult] = await Promise.all([
      db
        .from("sports_tracking_rules")
        .select("competition_id,country_code,region,competition_kind,division_level,enabled,always_track")
        .eq("enabled", true)
        .eq("always_track", true)
        .limit(250),
      db
        .from("sports_fixtures")
        .select(
          "id,kickoff_at,status,home_goals,away_goals,competition:sports_competitions!sports_fixtures_competition_id_fkey(id,name,country_code,region,competition_kind,division_level),home_team:sports_teams!sports_fixtures_home_team_id_fkey(id,name,logo_url,five_dollar_team_id),away_team:sports_teams!sports_fixtures_away_team_id_fkey(id,name,logo_url,five_dollar_team_id)",
        )
        .gte("kickoff_at", start.toISOString())
        .lt("kickoff_at", end.toISOString())
        .order("kickoff_at", { ascending: true })
        .limit(300),
    ]);

    if (rulesResult.error) throw new BackendError("INTERNAL_ERROR", "Falha ao carregar o escopo esportivo acompanhado.", 500);
    if (fixturesResult.error) throw new BackendError("INTERNAL_ERROR", "Falha ao carregar a agenda do dia.", 500);

    const rules = records(rulesResult.data).map(parseRule).filter((rule): rule is TrackingRule => rule !== null);
    const rawFixtures = records(fixturesResult.data).map(parseFixture).filter((fixture): fixture is RawFixture => fixture !== null);
    const trackedFixtures = rawFixtures.filter((fixture) => isTracked(fixture, rules));
    const fixtureIds = trackedFixtures.map((fixture) => fixture.id);
    const providerTeamIds = Array.from(
      new Set(
        trackedFixtures.flatMap((fixture) => [fixture.home.fiveDollarTeamId, fixture.away.fiveDollarTeamId]).filter((id): id is number => id !== null),
      ),
    );
    const recentSince = new Date(start.getTime() - 90 * 86_400_000).toISOString();

    const broadcastsPromise = fixtureIds.length
      ? db
          .from("sports_broadcast_evidence")
          .select("fixture_id,broadcaster,platform,source_name,source_url,checked_at,confidence,is_primary")
          .in("fixture_id", fixtureIds)
          .order("is_primary", { ascending: false })
          .order("confidence", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [], error: null } satisfies DbResponse);

    const eloPromise = providerTeamIds.length
      ? db
          .from("elo_global_team_ratings")
          .select("team_id,global_rating,local_rating,league_rating,matches_processed,updated_at")
          .in("team_id", providerTeamIds)
          .order("updated_at", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [], error: null } satisfies DbResponse);

    const recentPromise = db
      .from("sports_fixtures")
      .select("kickoff_at,home_team_id,away_team_id,home_goals,away_goals")
      .eq("status", "FINISHED")
      .gte("kickoff_at", recentSince)
      .lt("kickoff_at", end.toISOString())
      .order("kickoff_at", { ascending: false })
      .limit(600);

    const [broadcastsResult, eloResult, recentResult] = await Promise.all([broadcastsPromise, eloPromise, recentPromise]);

    if (broadcastsResult.error) throw new BackendError("INTERNAL_ERROR", "Falha ao carregar as transmissões confirmadas.", 500);
    if (eloResult.error) throw new BackendError("INTERNAL_ERROR", "Falha ao carregar o Elo atual das equipes.", 500);
    if (recentResult.error) throw new BackendError("INTERNAL_ERROR", "Falha ao carregar a forma recente das equipes.", 500);

    const broadcastsByFixture = new Map<string, BroadcastEvidence[]>();
    for (const parsed of records(broadcastsResult.data).map(parseBroadcast)) {
      if (!parsed) continue;
      const list = broadcastsByFixture.get(parsed.fixtureId) ?? [];
      list.push(parsed.evidence);
      broadcastsByFixture.set(parsed.fixtureId, list);
    }

    const eloByTeam = new Map<number, EloSnapshot>();
    for (const parsed of records(eloResult.data).map(parseElo)) {
      if (!parsed || eloByTeam.has(parsed.teamId)) continue;
      eloByTeam.set(parsed.teamId, parsed.snapshot);
    }

    const recentFixtures = records(recentResult.data).map(parseRecentFixture).filter((fixture): fixture is RecentFixture => fixture !== null);

    const fixtures: TodayFixture[] = trackedFixtures.map((fixture) => ({
      id: fixture.id,
      kickoffAt: fixture.kickoffAt,
      status: fixture.status,
      homeGoals: fixture.homeGoals,
      awayGoals: fixture.awayGoals,
      competition: fixture.competition,
      home: {
        ...fixture.home,
        elo: fixture.home.fiveDollarTeamId === null ? null : eloByTeam.get(fixture.home.fiveDollarTeamId) ?? null,
        recentForm: recentForm(fixture.home.id, fixture.kickoffAt, recentFixtures),
      },
      away: {
        ...fixture.away,
        elo: fixture.away.fiveDollarTeamId === null ? null : eloByTeam.get(fixture.away.fiveDollarTeamId) ?? null,
        recentForm: recentForm(fixture.away.id, fixture.kickoffAt, recentFixtures),
      },
      broadcasts: broadcastsByFixture.get(fixture.id) ?? [],
    }));

    const uniqueTeamIds = new Set(fixtures.flatMap((fixture) => [fixture.home.id, fixture.away.id]));
    const eloCoveredTeams = new Set(
      fixtures
        .flatMap((fixture) => [fixture.home.elo ? fixture.home.id : null, fixture.away.elo ? fixture.away.id : null])
        .filter((id): id is string => id !== null),
    );

    return {
      localDate: dateKey,
      observedAt: observedAt.toISOString(),
      fixtures,
      coverage: {
        trackedFixtures: fixtures.length,
        confirmedBroadcastFixtures: fixtures.filter((fixture) => fixture.broadcasts.length > 0).length,
        eloCoveredTeams: eloCoveredTeams.size,
        totalTeams: uniqueTeamIds.size,
      },
    };
  });
