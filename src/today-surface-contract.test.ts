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

  it("applies the canonical tracked scope in SQL before the agenda display limit", () => {
    const server = source("./lib/today-overview.functions.ts");
    const migration = source("../supabase/migrations/20260920160000_today_tracked_scope_v2.sql");
    expect(server).toContain('db.rpc("get_today_tracked_fixtures"');
    expect(server).toContain("p_limit: 300");
    expect(migration).toContain("sports_tracking_rules");
    expect(migration).toContain("tr.always_track=true");
    expect(migration.indexOf("and exists (")).toBeLessThan(migration.indexOf("limit least"));
  });

  it("keeps transmission, Elo and recent form grounded in stored data", () => {
    const server = source("./lib/today-overview.functions.ts");
    expect(server).toContain('from("sports_broadcast_evidence")');
    expect(server).toContain('from("elo_global_team_ratings")');
    expect(server).toContain('db.rpc("get_recent_team_fixtures"');
    expect(server).not.toContain(".limit(600)");
    expect(server).not.toContain("fetch(");
  });

  it("scopes recent form to Today teams before applying the per-team limit", () => {
    const server = source("./lib/today-overview.functions.ts");
    const migration = source("../supabase/migrations/20260920161500_today_recent_form_scope_v1.sql");
    expect(server).toContain("p_team_ids: sportsTeamIds");
    expect(server).toContain("p_per_team: 5");
    expect(migration).toContain("partition by tt.team_id");
    expect(migration).toContain("recent_rank<=");
    expect(migration).toContain("distinct on (fixture_id)");
  });



  it("keeps transmission resilient with explicit primary and fallback guide provenance", () => {
    const sync = source("./lib/sports/futnatv-broadcast-sync.server.ts");
    const status = source("./lib/broadcast-status.functions.ts");
    expect(sync).toContain('const FUTNATV_URL = "https://futnatv.net/"');
    expect(sync).toContain('const FUTEBOL_TV_URL = "https://futebol.tv.br/"');
    expect(sync).toContain("parseFutebolTvListings");
    expect(sync).toContain('sourceKind: "FUTNATV" | "AGGREGATOR"');
    expect(sync).toContain('source_name: source.sourceName');
    expect(status).toContain('select("last_attempt_at,last_success_at,last_error,metadata")');
    expect(status).toContain('metadata["sourceName"]');
  });

  it("keeps recent-form history seeding lightweight and outside detailed player backfill", () => {
    const sync = source("./lib/sports/five-dollar-sports-sync.server.ts");
    const worker = source("./lib/sports/sports-job-worker.server.ts");
    const migration = source("../supabase/migrations/20260920163000_today_recent_form_history_seed.sql");
    const basicStart = sync.indexOf("async function persistRecentFormFixtureBasic");
    const basicEnd = sync.indexOf("export interface FiveDollarRecentFormLeagueSyncResult");

    expect(sync).toContain("fiveDollarLeagueHistory");
    expect(sync).toContain("selectRecentFormFixtures");
    expect(worker).toContain('job.job_type === "FIVE_DOLLAR_RECENT_FORM_LEAGUE"');
    expect(migration).toContain("'40 7 * * *'");
    expect(basicStart).toBeGreaterThan(-1);
    expect(basicEnd).toBeGreaterThan(basicStart);

    const basicPersist = sync.slice(basicStart, basicEnd);
    expect(basicPersist).not.toContain("persistStats");
    expect(basicPersist).not.toContain("persistEvents");
    expect(basicPersist).not.toContain("sports_match_fact_packs");
    expect(basicPersist).not.toContain("API_FOOTBALL");
    expect(basicPersist).not.toContain("enqueue_sports_job");
  });

  it("renders one expandable row per fixture with explicit missing-data states", () => {
    const row = source("./components/TodayFixtureRow.tsx");
    expect(row).toContain("<details");
    expect(row).toContain("Momento recente");
    expect(row).toContain("Elo atual");
    expect(row).toContain("Onde assistir");
    expect(row).toContain("Transmissão ainda não confirmada");
  });

  it("keeps the fixture summary scannable with teams, logos, status and split score", () => {
    const row = source("./components/TodayFixtureRow.tsx");
    expect(row).toContain("function TeamLogo");
    expect(row).toContain("team.logoUrl");
    expect(row).toContain('loading="lazy"');
    expect(row).toContain("function MatchTeam");
    expect(row).toContain("score?.home");
    expect(row).toContain("score?.away");
    expect(row).toContain('label: "Adiado"');
    expect(row).toContain('label: "Cancelado"');
    expect(row).toContain("Brasília");
    expect(row).toContain('className="touch-target cursor-pointer');
  });

  it("prioritizes the agenda before coverage metrics", () => {
    const route = source("./routes/hoje.tsx");
    expect(route.indexOf('title="Agenda do dia"')).toBeGreaterThan(-1);
    expect(route.indexOf('title="Cobertura do dia"')).toBeGreaterThan(-1);
    expect(route.indexOf('title="Agenda do dia"')).toBeLessThan(route.indexOf('title="Cobertura do dia"'));
  });

  it("supports search, useful agenda filters, refresh, loading and retry", () => {
    const route = source("./routes/hoje.tsx");
    expect(route).toContain("useServerFn(getTodayOverview)");
    expect(route).toContain("<SearchField");
    expect(route).toContain("Próximos ·");
    expect(route).toContain("Com transmissão ·");
    expect(route).toContain("Ao vivo ·");
    expect(route).toContain("Encerrados ·");
    expect(route).toContain("Atualizado às");
    expect(route).toContain("<LoadingState");
    expect(route).toContain("<ErrorState");
    expect(route).toContain("Atualizar");
  });
});
