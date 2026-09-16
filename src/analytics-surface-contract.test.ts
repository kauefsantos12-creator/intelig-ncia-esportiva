import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("Analytics 26/27 sports intelligence contract", () => {
  it("loads analytics only through authenticated server boundaries", () => {
    const server = source("./lib/analytics-overview.functions.ts");
    expect(server).toContain('createServerFn({ method: "GET" })');
    expect(server).toContain(".middleware([requireSupabaseAuth])");
    expect(server).toContain("if (!context.userId)");
    expect(server).toContain("await adminDb()");
  });

  it("uses normalized season data instead of recalculating sports data in the browser", () => {
    const server = source("./lib/analytics-overview.functions.ts");
    expect(server).toContain('from("sports_standings")');
    expect(server).toContain('from("sports_player_season_stats")');
    expect(server).toContain('from("sports_team_squads")');
    expect(server).toContain('from("sports_fixtures")');
    expect(server).not.toContain("fetch(");
  });

  it("keeps the canonical 26/27 scope and tournament-specific team detail", () => {
    const server = source("./lib/analytics-overview.functions.ts");
    expect(server).toContain('const season = "2026/27"');
    expect(server).toContain('.eq("competition_id", data.competitionId)');
    expect(server).toContain('.eq("season", data.season)');
  });

  it("renders progressive filters, standings, roster and calendar states", () => {
    const route = source("./routes/analytics.tsx");
    expect(route).toContain("useServerFn(getAnalyticsDirectory)");
    expect(route).toContain("useServerFn(getAnalyticsTeamDetail)");
    expect(route).toContain("Todas as regiões");
    expect(route).toContain("Todos os países");
    expect(route).toContain("Classificação");
    expect(route).toContain("Elenco");
    expect(route).toContain("Calendário e resultados");
    expect(route).toContain("<LoadingState");
    expect(route).toContain("<ErrorState");
    expect(route).toContain("<EmptyState");
  });

  it("does not access Supabase directly from the Analytics route", () => {
    const route = source("./routes/analytics.tsx");
    expect(route).not.toContain("supabase.from");
    expect(route).not.toContain("adminDb");
  });
});
