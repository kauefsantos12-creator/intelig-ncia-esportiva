import { randomUUID } from "node:crypto";

import { syncApiFootballFixtureDataQuotaAware } from "./api-football-quota-sync.server";
import {
  syncNationalLeagueTeams,
  syncNationalTeamSquad,
} from "./api-football-national-squads.server";
import { linkApiFootballFixture } from "./api-football-sports-sync.server";
import { syncFutNaTvBroadcasts } from "./futnatv-broadcast-sync.server";
import { sportsDb } from "./sports-db.server";
import {
  SportsJobExecutionError,
  sportsJobFailureDecision,
  type SportsJobFailureCode,
} from "./sports-job-policy";

const SEASON = "2026/27";
const LEASE_SECONDS = 240;
const HEARTBEAT_MS = 45_000;
const DEFAULT_BATCH_SIZE = 1;

type Row = Record<string, unknown>;

interface SportsJobRow extends Row {
  id: string;
  job_type: string;
  fixture_id: string | null;
  payload: unknown;
  attempts: number;
  max_attempts: number;
}

export interface SportsJobWorkerItemResult {
  jobId: string;
  jobType: string;
  fixtureId: string | null;
  status: "SUCCEEDED" | "FAILED" | "DEAD" | "STALE";
  attempts: number;
  detail: string;
}

export interface SportsJobWorkerResult {
  workerToken: string;
  claimed: number;
  results: SportsJobWorkerItemResult[];
  queueEmpty: boolean;
}

function asRecord(value: unknown): Row | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Row : null;
}

function rpcRow(value: unknown): SportsJobRow | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  const row = asRecord(candidate);
  if (!row || typeof row["id"] !== "string" || typeof row["job_type"] !== "string") return null;
  return {
    ...row,
    id: row["id"] as string,
    job_type: row["job_type"] as string,
    fixture_id: typeof row["fixture_id"] === "string" ? row["fixture_id"] as string : null,
    payload: row["payload"],
    attempts: Number(row["attempts"] ?? 0),
    max_attempts: Number(row["max_attempts"] ?? 5),
  };
}

function fixtureIdFor(job: SportsJobRow): string {
  if (job.fixture_id) return job.fixture_id;
  const payload = asRecord(job.payload);
  const payloadFixture = payload?.["fixtureId"];
  if (typeof payloadFixture === "string" && payloadFixture.trim()) return payloadFixture;
  throw new SportsJobExecutionError("INVALID_PAYLOAD", `Job ${job.id} sem fixtureId.`);
}

function teamPayloadFor(job: SportsJobRow) {
  const payload = asRecord(job.payload);
  const teamId = payload?.["teamId"];
  const apiTeamId = Number(payload?.["apiTeamId"]);
  if (typeof teamId !== "string" || !teamId.trim() || !Number.isInteger(apiTeamId) || apiTeamId <= 0) {
    throw new SportsJobExecutionError("INVALID_PAYLOAD", `Job ${job.id} sem teamId/apiTeamId válidos.`);
  }
  return { teamId, apiTeamId };
}

function leagueIdFor(job: SportsJobRow): number {
  const payload = asRecord(job.payload);
  const leagueId = Number(payload?.["leagueId"]);
  if (!Number.isInteger(leagueId) || leagueId <= 0) {
    throw new SportsJobExecutionError("INVALID_PAYLOAD", `Job ${job.id} sem leagueId válido.`);
  }
  return leagueId;
}

function broadcastDateFor(job: SportsJobRow): string {
  const payload = asRecord(job.payload);
  const date = payload?.["date"];
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  throw new SportsJobExecutionError("INVALID_PAYLOAD", `Job ${job.id} sem date válido para BROADCAST_SYNC.`);
}

function syncDescriptor(job: SportsJobRow) {
  if (job.job_type === "BROADCAST_SYNC") {
    return { provider: "futnatv", domain: "broadcasts", cursor: broadcastDateFor(job) };
  }
  if (job.job_type === "API_FOOTBALL_LEAGUE_TEAMS") {
    return { provider: "api_football", domain: "league_teams", cursor: String(leagueIdFor(job)) };
  }
  if (job.job_type === "API_FOOTBALL_TEAM_SQUAD") {
    return { provider: "api_football", domain: "team_squad", cursor: teamPayloadFor(job).teamId };
  }
  return {
    provider: "api_football",
    domain: job.job_type === "API_FOOTBALL_LINK" ? "fixture_link" : "fixture_data",
    cursor: fixtureIdFor(job),
  };
}

function failureCode(error: unknown): SportsJobFailureCode {
  if (error instanceof SportsJobExecutionError) return error.code;
  return "EXECUTION_ERROR";
}

function failureMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function markSyncAttempt(job: SportsJobRow) {
  const db = await sportsDb();
  const descriptor = syncDescriptor(job);
  const { error } = await db.from("sports_sync_state").upsert({
    provider: descriptor.provider,
    domain: descriptor.domain,
    season: SEASON,
    cursor_value: descriptor.cursor,
    last_attempt_at: new Date().toISOString(),
    last_error: null,
    metadata: { jobId: job.id, jobType: job.job_type, attempt: job.attempts },
  }, { onConflict: "provider,domain,season" });
  if (error) console.warn("[sports-job-worker] failed to mark sync attempt", error.message);
}

async function markSyncSuccess(job: SportsJobRow, metadata: Row) {
  const db = await sportsDb();
  const descriptor = syncDescriptor(job);
  const now = new Date().toISOString();
  const { error } = await db.from("sports_sync_state").upsert({
    provider: descriptor.provider,
    domain: descriptor.domain,
    season: SEASON,
    cursor_value: descriptor.cursor,
    last_attempt_at: now,
    last_success_at: now,
    last_error: null,
    metadata: { jobId: job.id, jobType: job.job_type, attempt: job.attempts, ...metadata },
  }, { onConflict: "provider,domain,season" });
  if (error) console.warn("[sports-job-worker] failed to mark sync success", error.message);
}

async function markSyncFailure(job: SportsJobRow, errorMessage: string, metadata: Row) {
  const db = await sportsDb();
  let descriptor: { provider: string; domain: string; cursor: string | null };
  try {
    descriptor = syncDescriptor(job);
  } catch {
    descriptor = { provider: "sports_worker", domain: job.job_type.toLocaleLowerCase("pt-BR"), cursor: job.fixture_id };
  }
  const { error } = await db.from("sports_sync_state").upsert({
    provider: descriptor.provider,
    domain: descriptor.domain,
    season: SEASON,
    cursor_value: descriptor.cursor,
    last_attempt_at: new Date().toISOString(),
    last_error: errorMessage.slice(0, 4000),
    metadata: { jobId: job.id, jobType: job.job_type, attempt: job.attempts, ...metadata },
  }, { onConflict: "provider,domain,season" });
  if (error) console.warn("[sports-job-worker] failed to mark sync failure", error.message);
}

async function executeJob(job: SportsJobRow) {
  await markSyncAttempt(job);

  if (job.job_type === "BROADCAST_SYNC") {
    const date = broadcastDateFor(job);
    const result = await syncFutNaTvBroadcasts(date);
    await markSyncSuccess(job, {
      parsedListings: result.parsedListings,
      matchedFixtures: result.matchedFixtures,
      insertedEvidence: result.insertedEvidence,
      unmatchedListings: result.unmatchedListings,
      ambiguousListings: result.ambiguousListings,
      sourceUrl: result.sourceUrl,
      sourceName: result.sourceName,
      sourceKind: result.sourceKind,
    });
    return {
      fixtureId: null,
      detail: `BROADCAST_SYNC: ${result.matchedFixtures} fixtures, ${result.insertedEvidence} evidências de ${result.parsedListings} jogos da fonte.`,
    };
  }

  if (job.job_type === "API_FOOTBALL_LEAGUE_TEAMS") {
    const result = await syncNationalLeagueTeams(leagueIdFor(job));
    await markSyncSuccess(job, {
      leagueId: result.leagueId,
      competitionId: result.competitionId,
      teams: result.teams,
      squadJobs: result.squadJobs,
    });
    return {
      fixtureId: null,
      detail: `API_FOOTBALL_LEAGUE_TEAMS: ${result.leagueName}, ${result.teams} clubes, ${result.squadJobs} elencos enfileirados.`,
    };
  }

  if (job.job_type === "API_FOOTBALL_TEAM_SQUAD") {
    const payload = teamPayloadFor(job);
    const result = await syncNationalTeamSquad(payload.teamId, payload.apiTeamId);
    await markSyncSuccess(job, {
      teamId: result.teamId,
      apiTeamId: payload.apiTeamId,
      squadStatus: result.status,
      players: result.players,
    });
    return {
      fixtureId: null,
      detail: `API_FOOTBALL_TEAM_SQUAD: ${result.status}, ${result.players} jogadores persistidos.`,
    };
  }

  const fixtureId = fixtureIdFor(job);

  if (job.job_type === "API_FOOTBALL_LINK") {
    const result = await linkApiFootballFixture(fixtureId);
    if (result.status === "NOT_FOUND") {
      throw new SportsJobExecutionError("PROVIDER_NOT_FOUND", result.detail);
    }
    if (result.status === "UNAVAILABLE") {
      throw new SportsJobExecutionError("UPSTREAM_UNAVAILABLE", result.detail);
    }
    await markSyncSuccess(job, { linkStatus: result.status, apiFixtureId: result.apiFixtureId });
    return { fixtureId, detail: `${result.status}: ${result.detail}` };
  }

  if (job.job_type === "API_FOOTBALL_FIXTURE_DATA") {
    const result = await syncApiFootballFixtureDataQuotaAware(fixtureId);
    await markSyncSuccess(job, {
      apiFixtureId: result.apiFixtureId,
      lineups: result.lineups,
      playerStats: result.playerStats,
      squadPlayers: result.squadPlayers,
      injuries: result.injuries,
      enrichmentMode: result.enrichmentMode,
    });
    return {
      fixtureId,
      detail: `API_FOOTBALL_FIXTURE_DATA (${result.enrichmentMode}): ${result.lineups} lineups, ${result.playerStats} player stats, ${result.squadPlayers} squad rows, ${result.injuries} injuries.`,
    };
  }

  throw new SportsJobExecutionError("INVALID_JOB", `Job type não suportado: ${job.job_type}`);
}

function fixtureIdForResult(job: SportsJobRow): string | null {
  if (["BROADCAST_SYNC", "API_FOOTBALL_LEAGUE_TEAMS", "API_FOOTBALL_TEAM_SQUAD"].includes(job.job_type)) return null;
  try { return fixtureIdFor(job); } catch { return job.fixture_id; }
}

async function processClaimedJob(job: SportsJobRow, workerToken: string): Promise<SportsJobWorkerItemResult> {
  const db = await sportsDb();
  let leaseLost = false;
  const heartbeat = setInterval(() => {
    void (async () => {
      try {
        const { data, error } = await db.rpc("renew_sports_job_lease", {
          p_job_id: job.id,
          p_worker_token: workerToken,
          p_lease_seconds: LEASE_SECONDS,
        });
        if (error || data !== true) leaseLost = true;
      } catch {
        leaseLost = true;
      }
    })();
  }, HEARTBEAT_MS);

  try {
    const executed = await executeJob(job);
    if (leaseLost) {
      return { jobId: job.id, jobType: job.job_type, fixtureId: executed.fixtureId, status: "STALE", attempts: job.attempts, detail: "Lease perdido durante a execução." };
    }
    const completed = await db.rpc("complete_sports_job", { p_job_id: job.id, p_worker_token: workerToken });
    if (completed.error || completed.data !== true) {
      return { jobId: job.id, jobType: job.job_type, fixtureId: executed.fixtureId, status: "STALE", attempts: job.attempts, detail: "Resultado descartado por fencing de lease." };
    }
    return { jobId: job.id, jobType: job.job_type, fixtureId: executed.fixtureId, status: "SUCCEEDED", attempts: job.attempts, detail: executed.detail };
  } catch (error) {
    const message = failureMessage(error);
    const code = failureCode(error);
    const fixtureId = fixtureIdForResult(job);
    const decision = sportsJobFailureDecision({ attempts: job.attempts, maxAttempts: job.max_attempts, code, message });

    await markSyncFailure(job, message, { failureCode: code, decision: decision.action, reason: decision.reason });

    if (decision.action === "DEAD") {
      const dead = await db.rpc("dead_sports_job", { p_job_id: job.id, p_worker_token: workerToken, p_error: message });
      return {
        jobId: job.id,
        jobType: job.job_type,
        fixtureId,
        status: dead.error || dead.data !== true ? "STALE" : "DEAD",
        attempts: job.attempts,
        detail: `${decision.reason}: ${message}`,
      };
    }

    const failed = await db.rpc("fail_sports_job", {
      p_job_id: job.id,
      p_worker_token: workerToken,
      p_error: message,
      p_retry_after_seconds: decision.retryAfterSeconds,
    });
    const status = typeof failed.data === "string" ? failed.data : null;
    return {
      jobId: job.id,
      jobType: job.job_type,
      fixtureId,
      status: status === "DEAD" ? "DEAD" : status === "FAILED" ? "FAILED" : "STALE",
      attempts: job.attempts,
      detail: `${decision.reason}: ${message}`,
    };
  } finally {
    clearInterval(heartbeat);
  }
}

export async function runSportsJobWorker(batchSize = DEFAULT_BATCH_SIZE): Promise<SportsJobWorkerResult> {
  const db = await sportsDb();
  const workerToken = randomUUID();
  const limit = Math.max(1, Math.min(batchSize, 10));
  const results: SportsJobWorkerItemResult[] = [];
  let queueEmpty = false;

  for (let index = 0; index < limit; index += 1) {
    const claimed = await db.rpc("claim_sports_job", {
      p_worker_token: workerToken,
      p_lease_seconds: LEASE_SECONDS,
    });
    if (claimed.error) throw new Error(`Falha ao reclamar sports job: ${claimed.error.message}`);
    const job = rpcRow(claimed.data);
    if (!job) {
      queueEmpty = true;
      break;
    }
    results.push(await processClaimedJob(job, workerToken));
  }

  return { workerToken, claimed: results.length, results, queueEmpty };
}
