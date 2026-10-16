import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { BackendError } from "./backend-contract";
import {
  personalMatchReport,
  personalMatchReportInput,
  type PersonalMatchReport,
  type PersonalReportSaveResult,
} from "./personal-match-report";

type DbResult = { data: unknown; error: { code?: string; message: string } | null };
interface ReportsQuery extends PromiseLike<DbResult> {
  select(columns: string): ReportsQuery;
  eq(column: string, value: string): ReportsQuery;
  order(column: string, options: { ascending: boolean }): ReportsQuery;
  limit(value: number): ReportsQuery;
}
interface ReportsDb {
  from(table: string): ReportsQuery;
  rpc(name: string, parameters: Record<string, unknown>): PromiseLike<DbResult>;
}

function parseReport(row: unknown): PersonalMatchReport {
  if (typeof row !== "object" || row === null || Array.isArray(row))
    throw new Error("Invalid report response");
  const data = row as Record<string, unknown>;
  return personalMatchReport.parse({
    id: data["id"],
    version: data["version"],
    homeTeam: data["home_team"],
    awayTeam: data["away_team"],
    competition: data["competition"],
    kickoffAt: data["kickoff_at"],
    notes: data["notes"],
    updatedAt: data["updated_at"],
  });
}

export const getPersonalMatchReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PersonalMatchReport[]> => {
    if (!context.userId)
      throw new BackendError("UNAUTHENTICATED", "Faça login para continuar.", 401);
    const db = context.supabase as unknown as ReportsDb;
    const result = await db
      .from("sports_personal_match_reports")
      .select("id,version,home_team,away_team,competition,kickoff_at,notes,updated_at")
      .eq("owner_id", context.userId)
      .order("updated_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(100);
    if (result.error || !Array.isArray(result.data))
      throw new BackendError("INTERNAL_ERROR", "Não foi possível carregar seus relatos.", 500);
    return result.data.map(parseReport);
  });

export const savePersonalMatchReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => personalMatchReportInput.parse(input))
  .handler(async ({ data, context }): Promise<PersonalReportSaveResult> => {
    if (!context.userId)
      throw new BackendError("UNAUTHENTICATED", "Faça login para continuar.", 401);
    const db = context.supabase as unknown as ReportsDb;
    const result = await db.rpc("save_personal_match_report", {
      p_id: data.id,
      p_version: data.version,
      p_home_team: data.homeTeam,
      p_away_team: data.awayTeam,
      p_competition: data.competition || null,
      p_kickoff_at: data.kickoffAt,
      p_notes: data.notes,
    });
    if (result.error)
      return { ok: false, error: result.error.code === "40001" ? "CONFLICT" : "UNAVAILABLE" };
    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    return { ok: true, report: parseReport(row) };
  });
