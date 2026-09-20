import { fiveDollarGet, fiveDollarLeagueHistory } from "@/lib/adapters/five_dollar.server";
import {
  parseFixtures,
  teamRelativeStats,
  type FiveDollarFixture,
} from "@/lib/adapters/five_dollar.parse";
import { nullableProviderNumber } from "@/lib/domain/provider-value";
import { normalizeFixtureStatus, sportsJobIdempotencyKey } from "@/lib/domain/sports-data-contract";
import { saoPauloLocalDayUnixWindow } from "@/lib/sao-paulo-time";

import { sportsDb } from "./sports-db.server";

const SEASON = "2026/27";
const PAGE_SIZE = 50;

type Row = Record<string, unknown>;

function asRecord(value: unknown): Row | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Row : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function hasMore(payload: unknown): boolean {
  const root = asRecord(payload);
  const pagination = asRecord(root?.["pagination"]);
  return pagination?.["has_more"] === true;
}

function inferCompetitionKind(name: string, knownContinental: boolean): "LEAGUE" | "CUP" | "CONTINENTAL" | "OTHER" {
  if (knownContinental) return "CONTINENTAL";
  const normalized = name.toLowerCase();
  if (/champions|libertadores|sudamericana|europa league|conference league|continental/.test(normalized)) return "CONTINENTAL";
  if (/\bcup\b|\bcopa\b|\bcoppa\b|\bpokal\b|coupe|taça|taca/.test(normalized)) return "CUP";
  if (/league|liga|serie|bundesliga|premier|ligue|divisi|division|brasileir/.test(normalized)) return "LEAGUE";
  return "OTHER";
}

function eventExternalId(fixtureId: number, event: Row, index: number): string {
  const id = event["id"];
  if (typeof id === "string" || typeof id === "number") return String(id);
  const minute = nullableProviderNumber(event["minute"]) ?? "na";
  const type = text(event["type"]) ?? "event";
  const team = text(event["team"]) ?? "na";
  const player = text(event["player"]) ?? text(event["player_in"]) ?? "na";
  return `${fixtureId}:${index}:${minute}:${type}:${team}:${player}`;
}

async function leagueContext(db: Awaited<ReturnType<typeof sportsDb>>, leagueId: number) {
  const [target, cross] = await Promise.all([
    db.from("elo_target_leagues")
      .select("league_id,league_name,country_code,region,division_level")
      .eq("league_id", leagueId)
      .maybeSingle(),
    db.from("elo_cross_competitions")
      .select("competition_id,competition_name,region")
      .eq("competition_id", leagueId)
      .maybeSingle(),
  ]);
  const targetData = target.data as Row | null;
  const crossData = cross.data as Row | null;
  return {
    countryCode: text(targetData?.["country_code"]),
    region: text(targetData?.["region"]) ?? text(crossData?.["region"]),
    divisionLevel: nullableProviderNumber(targetData?.["division_level"]),
    knownContinental: Boolean(crossData),
  };
}

async function upsertCompetition(db: Awaited<ReturnType<typeof sportsDb>>, fixture: FiveDollarFixture) {
  if (fixture.leagueId === null) throw new Error(`Fixture ${fixture.eventId} sem league id.`);
  const context = await leagueContext(db, fixture.leagueId);
  const canonicalKey = `five-dollar:${fixture.leagueId}`;
  const row = {
    canonical_key: canonicalKey,
    name: fixture.tournament || `League ${fixture.leagueId}`,
    country_code: context.countryCode,
    region: context.region,
    competition_kind: inferCompetitionKind(fixture.tournament, context.knownContinental),
    division_level: context.divisionLevel,
    season: SEASON,
    five_dollar_league_id: fixture.leagueId,
    active: true,
    metadata: { source: "five_dollar" },
  };
  const { data, error } = await db.from("sports_competitions")
    .upsert(row, { onConflict: "canonical_key" })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Falha ao persistir competição ${fixture.tournament}: ${error?.message ?? "sem linha"}`);
  return { id: String((data as Row)["id"]), ...context };
}

async function upsertTeam(
  db: Awaited<ReturnType<typeof sportsDb>>,
  providerId: number | null,
  name: string,
  countryCode: string | null,
  region: string | null,
) {
  if (providerId === null) throw new Error(`Equipe ${name} sem id 5Dollar.`);
  const canonicalKey = `five-dollar:${providerId}`;
  const { data, error } = await db.from("sports_teams")
    .upsert({
      canonical_key: canonicalKey,
      name,
      country_code: countryCode,
      region,
      five_dollar_team_id: providerId,
      metadata: { source: "five_dollar" },
    }, { onConflict: "canonical_key" })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Falha ao persistir equipe ${name}: ${error?.message ?? "sem linha"}`);
  return String((data as Row)["id"]);
}

async function persistStats(
  db: Awaited<ReturnType<typeof sportsDb>>,
  fixture: FiveDollarFixture,
  fixtureId: string,
  homeTeamId: string,
  awayTeamId: string,
  fetchedAt: string,
) {
  if (fixture.statusType !== "finished") return 0;
  const predictionAt = new Date(Math.max(Date.now(), (fixture.startTimestamp ?? 0) * 1000 + 1)).toISOString();
  const rows: Row[] = [];
  for (const [providerTeamId, sportsTeamId] of [
    [fixture.homeTeamId, homeTeamId],
    [fixture.awayTeamId, awayTeamId],
  ] as const) {
    if (providerTeamId === null) continue;
    const relative = teamRelativeStats(fixture, providerTeamId, predictionAt);
    if (!relative) continue;
    for (const stat of relative.stats) {
      rows.push({
        fixture_id: fixtureId,
        team_id: sportsTeamId,
        stat_key: stat.canonical,
        stat_value: stat.value,
        stat_text: null,
        provider: "five_dollar",
        observed_at: fixture.kickoffIso,
        fetched_at: fetchedAt,
        metadata: { source_label: stat.sourceLabel },
      });
    }
  }
  if (rows.length === 0) return 0;
  const { error } = await db.from("sports_fixture_team_stats")
    .upsert(rows, { onConflict: "fixture_id,team_id,stat_key,provider" });
  if (error) throw new Error(`Falha ao persistir estatísticas da fixture ${fixture.eventId}: ${error.message}`);
  return rows.length;
}

async function persistEvents(db: Awaited<ReturnType<typeof sportsDb>>, fixture: FiveDollarFixture, fixtureId: string, homeTeamId: string, awayTeamId: string, fetchedAt: string) {
  if (fixture.embeddedEvents.length === 0) return 0;
  const rows = fixture.embeddedEvents.map((event, index) => {
    const teamSide = text(event["team"]);
    const player = text(event["player"]) ?? text(event["player_in"]) ?? text(event["scorer"]);
    return {
      fixture_id: fixtureId,
      provider: "five_dollar",
      external_event_id: eventExternalId(fixture.eventId, event, index),
      minute: nullableProviderNumber(event["minute"]),
      added_minute: nullableProviderNumber(event["added_minute"]) ?? nullableProviderNumber(event["extra_minute"]),
      event_type: text(event["type"]) ?? "unknown",
      detail: text(event["detail"]) ?? text(event["reason"]),
      team_id: teamSide === "home" ? homeTeamId : teamSide === "away" ? awayTeamId : null,
      player_external_id: null,
      player_name: player,
      metadata: event,
      fetched_at: fetchedAt,
    };
  });
  const { error } = await db.from("sports_fixture_events")
    .upsert(rows, { onConflict: "fixture_id,provider,external_event_id" });
  if (error) throw new Error(`Falha ao persistir eventos da fixture ${fixture.eventId}: ${error.message}`);
  return rows.length;
}

async function persistFixture(db: Awaited<ReturnType<typeof sportsDb>>, fixture: FiveDollarFixture, fetchedAt: string) {
  const competition = await upsertCompetition(db, fixture);
  const homeTeamId = await upsertTeam(db, fixture.homeTeamId, fixture.homeName, competition.countryCode, competition.region);
  const awayTeamId = await upsertTeam(db, fixture.awayTeamId, fixture.awayName, competition.countryCode, competition.region);
  const status = normalizeFixtureStatus(fixture.statusType);
  const kickoffAt = fixture.kickoffIso ?? (fixture.startTimestamp ? new Date(fixture.startTimestamp * 1000).toISOString() : null);
  if (!kickoffAt) throw new Error(`Fixture ${fixture.eventId} sem kickoff.`);
  const canonicalKey = `five-dollar:${fixture.eventId}`;
  const { data, error } = await db.from("sports_fixtures")
    .upsert({
      canonical_key: canonicalKey,
      primary_provider: "five_dollar",
      primary_fixture_id: String(fixture.eventId),
      five_dollar_fixture_id: fixture.eventId,
      competition_id: competition.id,
      season: SEASON,
      kickoff_at: kickoffAt,
      status,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      home_goals: fixture.homeScore,
      away_goals: fixture.awayScore,
      source_fetched_at: fetchedAt,
      metadata: { tournament: fixture.tournament },
    }, { onConflict: "canonical_key" })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Falha ao persistir fixture ${fixture.eventId}: ${error?.message ?? "sem linha"}`);
  const sportsFixtureId = String((data as Row)["id"]);

  const [stats, events] = await Promise.all([
    persistStats(db, fixture, sportsFixtureId, homeTeamId, awayTeamId, fetchedAt),
    persistEvents(db, fixture, sportsFixtureId, homeTeamId, awayTeamId, fetchedAt),
  ]);

  if (status === "FINISHED") {
    const factPack = {
      fixtureId: fixture.eventId,
      competition: fixture.tournament,
      kickoffAt,
      homeTeam: fixture.homeName,
      awayTeam: fixture.awayName,
      homeGoals: fixture.homeScore,
      awayGoals: fixture.awayScore,
      status,
      corners: { home: fixture.cornersHome, away: fixture.cornersAway },
      cards: {
        home: { yellow: fixture.yellowHome, red: fixture.redHome },
        away: { yellow: fixture.yellowAway, red: fixture.redAway },
      },
      statistics: fixture.embeddedStatistics,
      events: fixture.embeddedEvents,
      source: "five_dollar",
      fetchedAt,
    };
    const factResult = await db.from("sports_match_fact_packs").upsert({
      fixture_id: sportsFixtureId,
      definition_version: "fact-pack-v1",
      payload: factPack,
      source_fetched_at: fetchedAt,
      generated_at: new Date().toISOString(),
    }, { onConflict: "fixture_id" });
    if (factResult.error) throw new Error(`Falha ao gerar fact pack ${fixture.eventId}: ${factResult.error.message}`);
  }

  const scopeResult = await db.rpc("sports_fixture_in_api_football_scope", {
    p_fixture_id: sportsFixtureId,
  });
  if (scopeResult.error) {
    throw new Error(`Falha ao validar escopo API-Football da fixture ${fixture.eventId}: ${scopeResult.error.message}`);
  }

  if (scopeResult.data === true) {
    const jobKey = sportsJobIdempotencyKey("api-football-link", canonicalKey);
    const enqueueResult = await db.rpc("enqueue_sports_job", {
      p_idempotency_key: jobKey,
      p_job_type: "API_FOOTBALL_LINK",
      p_fixture_id: sportsFixtureId,
      p_payload: { fixtureId: sportsFixtureId },
      p_max_attempts: 5,
    });
    if (enqueueResult.error) {
      throw new Error(`Falha ao enfileirar vínculo API-Football da fixture ${fixture.eventId}: ${enqueueResult.error.message}`);
    }
  }

  return { sportsFixtureId, stats, events, status };
}

export function selectRecentFormFixtures(
  fixtures: FiveDollarFixture[],
  teamIds: number[],
  perTeam = 5,
): FiveDollarFixture[] {
  const targets = new Set(teamIds);
  const selected = new Map<number, FiveDollarFixture>();
  const limit = Math.max(1, Math.min(perTeam, 10));

  for (const teamId of targets) {
    fixtures
      .filter((fixture) => fixture.homeTeamId === teamId || fixture.awayTeamId === teamId)
      .sort((a, b) => (b.startTimestamp ?? 0) - (a.startTimestamp ?? 0))
      .slice(0, limit)
      .forEach((fixture) => selected.set(fixture.eventId, fixture));
  }

  return [...selected.values()].sort((a, b) => (b.startTimestamp ?? 0) - (a.startTimestamp ?? 0));
}

export function teamsNeedingRecentFormSupplement(
  fixtures: FiveDollarFixture[],
  teamIds: number[],
  perTeam = 5,
): number[] {
  const limit = Math.max(1, Math.min(perTeam, 10));
  return [...new Set(teamIds)].filter((teamId) => {
    const matches = fixtures.filter(
      (fixture) => fixture.homeTeamId === teamId || fixture.awayTeamId === teamId,
    ).length;
    return matches < limit;
  });
}

async function fetchRecentTeamFixtures(
  teamId: number,
  predictionAtIso: string,
  maxEvents = 5,
): Promise<{ fixtures: FiveDollarFixture[]; fetchedAt: string; status: string; errorMessage: string | null }> {
  const cutoff = Math.floor(Date.parse(predictionAtIso) / 1000) - 1;
  const perPage = Math.max(1, Math.min(maxEvents, 10));
  const response = await fiveDollarGet(
    `/teams/${teamId}/fixtures?status=finished&end_time=${cutoff}&page=1&per_page=${perPage}`,
    { cacheTtlMs: 15 * 60_000 },
  );

  if (response.status !== "OK" || response.payload === null) {
    return {
      fixtures: [],
      fetchedAt: response.fetchedAt,
      status: response.status,
      errorMessage: response.errorMessage,
    };
  }

  const fixtures = parseFixtures(response.payload)
    .filter(
      (fixture) =>
        fixture.statusType === "finished" &&
        fixture.startTimestamp !== null &&
        fixture.startTimestamp * 1000 < Date.parse(predictionAtIso) &&
        (fixture.homeTeamId === teamId || fixture.awayTeamId === teamId),
    )
    .sort((a, b) => (b.startTimestamp ?? 0) - (a.startTimestamp ?? 0))
    .slice(0, perPage);

  return {
    fixtures,
    fetchedAt: response.fetchedAt,
    status: response.status,
    errorMessage: null,
  };
}

async function persistRecentFormFixtureBasic(
  db: Awaited<ReturnType<typeof sportsDb>>,
  fixture: FiveDollarFixture,
  fetchedAt: string,
) {
  const competition = await upsertCompetition(db, fixture);
  const homeTeamId = await upsertTeam(
    db,
    fixture.homeTeamId,
    fixture.homeName,
    competition.countryCode,
    competition.region,
  );
  const awayTeamId = await upsertTeam(
    db,
    fixture.awayTeamId,
    fixture.awayName,
    competition.countryCode,
    competition.region,
  );
  const kickoffAt =
    fixture.kickoffIso ??
    (fixture.startTimestamp ? new Date(fixture.startTimestamp * 1000).toISOString() : null);
  if (!kickoffAt) throw new Error(`Fixture ${fixture.eventId} sem kickoff.`);

  const { error } = await db.from("sports_fixtures").upsert(
    {
      canonical_key: `five-dollar:${fixture.eventId}`,
      primary_provider: "five_dollar",
      primary_fixture_id: String(fixture.eventId),
      five_dollar_fixture_id: fixture.eventId,
      competition_id: competition.id,
      season: SEASON,
      kickoff_at: kickoffAt,
      status: normalizeFixtureStatus(fixture.statusType),
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      home_goals: fixture.homeScore,
      away_goals: fixture.awayScore,
      source_fetched_at: fetchedAt,
    },
    { onConflict: "canonical_key" },
  );
  if (error) {
    throw new Error(`Falha ao persistir fixture histórica ${fixture.eventId}: ${error.message}`);
  }
}

export interface FiveDollarRecentFormLeagueSyncResult {
  leagueId: number;
  targetTeams: number;
  fetchedFixtures: number;
  supplementalTeams: number;
  supplementalFixtures: number;
  selectedFixtures: number;
  persistedFixtures: number;
  failed: Array<{ fixtureId: number; error: string }>;
  fetches: number;
  fetchedAt: string | null;
}

export async function syncFiveDollarRecentFormLeague(
  leagueId: number,
  teamIds: number[],
  predictionAtIso: string,
  lookbackDays = 90,
): Promise<FiveDollarRecentFormLeagueSyncResult> {
  if (!Number.isInteger(leagueId) || leagueId <= 0) throw new Error("leagueId inválido.");
  const targets = [...new Set(teamIds.filter((id) => Number.isInteger(id) && id > 0))];
  if (targets.length === 0) throw new Error("Nenhum time 5Dollar válido para recent form.");
  if (!Number.isFinite(Date.parse(predictionAtIso))) throw new Error("predictionAtIso inválido.");

  const history = await fiveDollarLeagueHistory(leagueId, targets, predictionAtIso, lookbackDays);
  const failedFetch = history.fetches.find((fetch) => fetch.status !== "OK");
  if (failedFetch) {
    throw new Error(
      failedFetch.errorMessage ?? `5Dollar indisponível para histórico da liga ${leagueId}.`,
    );
  }

  const leagueSelected = selectRecentFormFixtures(history.fixtures, targets, 5);
  const supplementalTargets = teamsNeedingRecentFormSupplement(leagueSelected, targets, 5);
  const combinedFixtures = new Map<number, FiveDollarFixture>(
    leagueSelected.map((fixture) => [fixture.eventId, fixture]),
  );
  let supplementalFetches = 0;
  let latestFetchedAt = history.fetches[0]?.fetchedAt ?? null;

  for (const teamId of supplementalTargets) {
    const supplemental = await fetchRecentTeamFixtures(teamId, predictionAtIso, 5);
    supplementalFetches += 1;
    latestFetchedAt = supplemental.fetchedAt ?? latestFetchedAt;
    if (supplemental.status !== "OK") {
      throw new Error(
        supplemental.errorMessage ??
          `5Dollar indisponível para histórico do time ${teamId}.`,
      );
    }
    for (const fixture of supplemental.fixtures) {
      combinedFixtures.set(fixture.eventId, fixture);
    }
  }

  const selected = selectRecentFormFixtures([...combinedFixtures.values()], targets, 5);
  const leagueFixtureIds = new Set(leagueSelected.map((fixture) => fixture.eventId));
  const supplementalFixtures = selected.filter(
    (fixture) => !leagueFixtureIds.has(fixture.eventId),
  ).length;
  const db = await sportsDb();
  let persistedFixtures = 0;
  const failed: FiveDollarRecentFormLeagueSyncResult["failed"] = [];

  for (const fixture of selected) {
    try {
      await persistRecentFormFixtureBasic(db, fixture, latestFetchedAt ?? new Date().toISOString());
      persistedFixtures += 1;
    } catch (error) {
      failed.push({
        fixtureId: fixture.eventId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (failed.length > 0) {
    throw new Error(
      `Falha ao persistir ${failed.length}/${selected.length} fixtures históricas da liga ${leagueId}: ${failed
        .slice(0, 5)
        .map((item) => item.fixtureId)
        .join(", ")}`,
    );
  }

  return {
    leagueId,
    targetTeams: targets.length,
    fetchedFixtures: history.fixtures.length,
    supplementalTeams: supplementalTargets.length,
    supplementalFixtures,
    selectedFixtures: selected.length,
    persistedFixtures,
    failed,
    fetches: history.fetches.length + supplementalFetches,
    fetchedAt: latestFetchedAt,
  };
}

export interface FiveDollarDaySyncResult {
  date: string;
  fixtures: number;
  persisted: number;
  stats: number;
  events: number;
  failed: Array<{ fixtureId: number; error: string }>;
  fetches: number;
  fetchedAt: string | null;
}

export async function syncFiveDollarDay(isoDate: string): Promise<FiveDollarDaySyncResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) throw new Error("Data deve estar em YYYY-MM-DD.");
  const db = await sportsDb();
  const { start, end } = saoPauloLocalDayUnixWindow(isoDate);
  const fixtures = new Map<number, FiveDollarFixture>();
  let page = 1;
  let fetches = 0;
  let latestFetchedAt: string | null = null;

  await db.from("sports_sync_state").upsert({
    provider: "five_dollar",
    domain: "fixtures_daily",
    season: SEASON,
    cursor_value: isoDate,
    last_attempt_at: new Date().toISOString(),
    last_error: null,
  }, { onConflict: "provider,domain,season" });

  while (page <= 50) {
    const response = await fiveDollarGet(
      `/fixtures?start_time=${start}&end_time=${end}&include=events,stats&page=${page}&per_page=${PAGE_SIZE}`,
      { cacheTtlMs: 5 * 60_000 },
    );
    fetches += 1;
    latestFetchedAt = response.fetchedAt;
    if (response.status !== "OK" || response.payload === null) {
      const message = response.errorMessage ?? `5Dollar indisponível (${response.status}).`;
      await db.from("sports_sync_state").upsert({
        provider: "five_dollar",
        domain: "fixtures_daily",
        season: SEASON,
        cursor_value: isoDate,
        last_attempt_at: new Date().toISOString(),
        last_error: message,
      }, { onConflict: "provider,domain,season" });
      throw new Error(message);
    }
    for (const fixture of parseFixtures(response.payload)) fixtures.set(fixture.eventId, fixture);
    if (!hasMore(response.payload)) break;
    page += 1;
  }

  let persisted = 0;
  let stats = 0;
  let events = 0;
  const failed: FiveDollarDaySyncResult["failed"] = [];
  for (const fixture of fixtures.values()) {
    try {
      const result = await persistFixture(db, fixture, latestFetchedAt ?? new Date().toISOString());
      persisted += 1;
      stats += result.stats;
      events += result.events;
    } catch (error) {
      failed.push({ fixtureId: fixture.eventId, error: error instanceof Error ? error.message : String(error) });
    }
  }

  const failedIds = failed.slice(0, 10).map((item) => item.fixtureId).join(", ");
  await db.from("sports_sync_state").upsert({
    provider: "five_dollar",
    domain: "fixtures_daily",
    season: SEASON,
    cursor_value: isoDate,
    last_attempt_at: new Date().toISOString(),
    last_success_at: failed.length === 0 ? new Date().toISOString() : null,
    last_error: failed.length === 0
      ? null
      : `${failed.length} fixture(s) falharam${failedIds ? `: ${failedIds}` : ""}.`,
    metadata: {
      fixtures: fixtures.size,
      persisted,
      failed: failed.length,
      failures: failed.slice(0, 20),
      fetches,
    },
  }, { onConflict: "provider,domain,season" });

  return { date: isoDate, fixtures: fixtures.size, persisted, stats, events, failed, fetches, fetchedAt: latestFetchedAt };
}
