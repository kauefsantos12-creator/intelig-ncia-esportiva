import { apiFootballGet } from "@/lib/adapters/api_football.server";
import { fiveDollarApiStatus } from "@/lib/adapters/five_dollar.server";
import { nullableProviderNumber } from "@/lib/domain/provider-value";

import { sportsDb } from "./sports-db.server";

const SEASON = "2026/27";
const CACHE_RETENTION_MS = 24 * 60 * 60 * 1_000;

type Row = Record<string, unknown>;

type ProviderMaintenanceStatus = "OK" | "DEGRADED" | "NOT_CONFIGURED";

function asRecord(value: unknown): Row | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Row : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function apiFootballStatusMetadata(payload: unknown) {
  const root = asRecord(payload);
  const response = asRecord(root?.["response"]);
  const subscription = asRecord(response?.["subscription"]);
  const requests = asRecord(response?.["requests"]);
  return {
    plan: text(subscription?.["plan"]),
    limit: nullableProviderNumber(requests?.["limit_day"]),
    current: nullableProviderNumber(requests?.["current"]),
  };
}

async function persistApiFootballHealth() {
  const db = await sportsDb();
  const response = await apiFootballGet("/status");
  const checkedAt = response.fetchedAt;
  const metadata = apiFootballStatusMetadata(response.payload);

  const persist = await db.from("external_api_status_snapshots").upsert({
    provider: "api_football",
    plan: metadata.plan,
    reported_limit: metadata.limit,
    payload: {
      status: response.status,
      httpStatus: response.httpStatus,
      errorMessage: response.errorMessage,
      currentRequests: metadata.current,
      providerPayload: response.payload ?? {},
    },
    checked_at: checkedAt,
  }, { onConflict: "provider" });
  if (persist.error) throw new Error(`Falha ao persistir saúde API-Football: ${persist.error.message}`);

  return {
    status: response.status,
    httpStatus: response.httpStatus,
    errorMessage: response.errorMessage,
    checkedAt,
    plan: metadata.plan,
    limit: metadata.limit,
    current: metadata.current,
  };
}

async function cleanupExpiredProviderCache() {
  const db = await sportsDb();
  const cutoff = new Date(Date.now() - CACHE_RETENTION_MS).toISOString();
  const result = await db.from("external_api_cache")
    .delete({ count: "exact" })
    .lt("expires_at", cutoff);
  if (result.error) throw new Error(`Falha ao limpar cache externo expirado: ${result.error.message}`);
  return result.count ?? 0;
}

async function recoverInconsistentLinkJobs() {
  const db = await sportsDb();
  const result = await db.rpc("requeue_unlinked_api_football_jobs");
  if (result.error) throw new Error(`Falha ao recuperar jobs API-Football: ${result.error.message}`);
  return Number(result.data ?? 0);
}

async function queueSummary() {
  const db = await sportsDb();
  const result = await db.from("sports_jobs")
    .select("job_type,status")
    .in("job_type", ["API_FOOTBALL_LINK", "API_FOOTBALL_FIXTURE_DATA"]);
  if (result.error) throw new Error(`Falha ao ler fila esportiva: ${result.error.message}`);
  const summary: Record<string, number> = {};
  for (const row of result.data ?? []) {
    const key = `${String(row.job_type)}:${String(row.status)}`;
    summary[key] = (summary[key] ?? 0) + 1;
  }
  return summary;
}

export async function runSportsApiMaintenance() {
  const checkedAt = new Date().toISOString();
  const [fiveDollar, apiFootball] = await Promise.all([
    fiveDollarApiStatus(),
    persistApiFootballHealth(),
  ]);
  const fiveDollarFetch = fiveDollar.fetched;

  const [requeuedJobs, expiredCacheRowsDeleted, queue] = await Promise.all([
    recoverInconsistentLinkJobs(),
    cleanupExpiredProviderCache(),
    queueSummary(),
  ]);

  const providerStatus: ProviderMaintenanceStatus =
    fiveDollarFetch.status === "NOT_CONFIGURED" || apiFootball.status === "NOT_CONFIGURED"
      ? "NOT_CONFIGURED"
      : fiveDollarFetch.status === "OK" && apiFootball.status === "OK"
        ? "OK"
        : "DEGRADED";

  const db = await sportsDb();
  const state = await db.from("sports_sync_state").upsert({
    provider: "system",
    domain: "api_maintenance",
    season: SEASON,
    cursor_value: checkedAt,
    last_attempt_at: checkedAt,
    last_success_at: providerStatus === "OK" ? checkedAt : null,
    last_error: providerStatus === "OK" ? null : `Provider maintenance status: ${providerStatus}`,
    metadata: {
      fiveDollar: {
        status: fiveDollarFetch.status,
        httpStatus: fiveDollarFetch.httpStatus,
        errorMessage: fiveDollarFetch.errorMessage,
        plan: fiveDollar.plan,
        limit: fiveDollar.limit,
      },
      apiFootball,
      requeuedJobs,
      expiredCacheRowsDeleted,
      queue,
    },
  }, { onConflict: "provider,domain,season" });
  if (state.error) throw new Error(`Falha ao persistir estado de manutenção: ${state.error.message}`);

  return {
    status: providerStatus,
    checkedAt,
    providers: {
      fiveDollar: {
        status: fiveDollarFetch.status,
        httpStatus: fiveDollarFetch.httpStatus,
        errorMessage: fiveDollarFetch.errorMessage,
        plan: fiveDollar.plan,
        limit: fiveDollar.limit,
      },
      apiFootball,
    },
    requeuedJobs,
    expiredCacheRowsDeleted,
    queue,
  };
}
