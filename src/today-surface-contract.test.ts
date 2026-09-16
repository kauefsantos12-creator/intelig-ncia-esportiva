import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("Hoje sports intelligence contract", () => {
  it("loads the agenda only through an authenticated server boundary", () => {
    const server = source("./lib/today-overview.functions.ts");
    expect(server).toContain('createServerFn({ method: "GET" })');
    expect(server).toContain(".middleware([requireSupabaseAuth])");
    expect(server).toContain("if (!context.userId)");
    expect(server).toContain("await adminDb()");
  });

  it("uses canonical fixtures and the tracked-scope semantics", () => {
    const server = source("./lib/today-overview.functions.ts");
    expect(server).toContain('from("sports_fixtures")');
    expect(server).toContain('from("sports_tracking_rules")');
    expect(server).toContain('.eq("always_track", true)');
    expect(server).toContain("isTracked(fixture, rules)");
  });

  it("keeps transmission, Elo and recent form grounded in stored data", () => {
    const server = source("./lib/today-overview.functions.ts");
    expect(server).toContain('from("sports_broadcast_evidence")');
    expect(server).toContain('from("elo_global_team_ratings")');
    expect(server).toContain('.eq("status", "FINISHED")');
    expect(server).not.toContain("fetch(");
  });

  it("renders one expandable row per fixture with explicit missing-data states", () => {
    const row = source("./components/TodayFixtureRow.tsx");
    expect(row).toContain("<details");
    expect(row).toContain("Momento recente");
    expect(row).toContain("Elo atual");
    expect(row).toContain("Onde assistir");
    expect(row).toContain("Transmissão ainda não confirmada");
  });

  it("supports search, agenda filters, refresh, loading and retry", () => {
    const route = source("./routes/hoje.tsx");
    expect(route).toContain("useServerFn(getTodayOverview)");
    expect(route).toContain("<SearchField");
    expect(route).toContain("Com transmissão");
    expect(route).toContain("Ao vivo");
    expect(route).toContain("<LoadingState");
    expect(route).toContain("<ErrorState");
    expect(route).toContain("Atualizar");
  });
});
