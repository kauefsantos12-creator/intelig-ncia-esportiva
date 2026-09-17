import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { adminDb } from "./admin-db";
import { BackendError } from "./backend-contract";

type DbError = { message: string } | null;
type DbResponse = { data: unknown; error: DbError };

interface Query extends PromiseLike<DbResponse> {
  select(columns?: string): Query;
  eq(column: string, value: unknown): Query;
  limit(value: number): Query;
}

interface Db {
  from(table: string): Query;
}

export type BroadcastSyncStatus = {
  state: "READY" | "ERROR" | "NEVER";
  sourceName: string;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  error: string | null;
};

function record(value: unknown): Record<string, unknown> | null {
  if (!Array.isArray(value) || typeof value[0] !== "object" || value[0] === null || Array.isArray(value[0])) return null;
  return value[0] as Record<string, unknown>;
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

export const getBroadcastSyncStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BroadcastSyncStatus> => {
    if (!context.userId) {
      throw new BackendError("UNAUTHENTICATED", "Faça login para continuar.", 401);
    }

    const db = (await adminDb()) as unknown as Db;
    const result = await db
      .from("sports_sync_state")
      .select("last_attempt_at,last_success_at,last_error")
      .eq("provider", "futnatv")
      .eq("domain", "broadcasts")
      .eq("season", "2026/27")
      .limit(1);

    if (result.error) {
      throw new BackendError("INTERNAL_ERROR", "Falha ao consultar o estado da fonte de transmissões.", 500);
    }

    const row = record(result.data);
    if (!row) {
      return {
        state: "NEVER",
        sourceName: "FutNaTV",
        lastAttemptAt: null,
        lastSuccessAt: null,
        error: null,
      };
    }

    const lastAttemptAt = text(row["last_attempt_at"]);
    const lastSuccessAt = text(row["last_success_at"]);
    const error = text(row["last_error"]);
    const hasFreshFailure = Boolean(
      error
      && lastAttemptAt
      && (!lastSuccessAt || new Date(lastAttemptAt).getTime() > new Date(lastSuccessAt).getTime()),
    );

    return {
      state: hasFreshFailure ? "ERROR" : lastSuccessAt ? "READY" : "NEVER",
      sourceName: "FutNaTV",
      lastAttemptAt,
      lastSuccessAt,
      error: hasFreshFailure ? error : null,
    };
  });
