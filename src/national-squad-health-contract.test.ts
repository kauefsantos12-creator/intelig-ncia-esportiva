import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("National squad health contract", () => {
  it("keeps the health read model behind authenticated server boundaries", () => {
    const server = source("./lib/national-squad-health.functions.ts");
    expect(server).toContain('createServerFn({ method: "GET" })');
    expect(server).toContain(".middleware([requireSupabaseAuth])");
    expect(server).toContain("if (!context.userId)");
    expect(server).toContain("await adminDb()");
  });

  it("measures the six national leagues from persisted data without provider calls", () => {
    const server = source("./lib/national-squad-health.functions.ts");
    for (const leagueId of [39, 61, 71, 78, 135, 140]) {
      expect(server).toContain(`leagueId: ${leagueId}`);
    }
    expect(server).toContain('from("sports_team_competitions")');
    expect(server).toContain('from("sports_team_squads")');
    expect(server).toContain('from("sports_jobs")');
    expect(server).toContain('from("sports_teams")');
    expect(server).not.toContain("apiFootballGet(");
    expect(server).not.toContain("fiveDollarGet(");
  });

  it("exposes mapping, squad freshness, queue and quota states", () => {
    const server = source("./lib/national-squad-health.functions.ts");
    expect(server).toContain("mappedApiIds");
    expect(server).toContain("squadsFresh");
    expect(server).toContain("pendingJobs");
    expect(server).toContain("deadJobs");
    expect(server).toContain('"DAILY_LIMIT"');
    expect(server).toContain('"RATE_LIMIT"');
  });

  it("renders the permanent health panel in the Analytics route without coupling it to AppShell", () => {
    const analytics = source("./routes/analytics.tsx");
    const shell = source("./components/AppShell.tsx");
    const panel = source("./components/NationalSquadHealthPanel.tsx");
    expect(analytics).toContain('import { NationalSquadHealthPanel } from "@/components/NationalSquadHealthPanel";');
    expect(analytics).toContain("<NationalSquadHealthPanel />");
    expect(shell).not.toContain("NationalSquadHealthPanel");
    expect(panel).toContain("Saúde dos elencos nacionais");
    expect(panel).toContain("Atualizar cobertura");
    expect(panel).toContain("A leitura deste painel não consome quota dos provedores");
  });
});
