import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("Elo sports intelligence contract", () => {
  it("loads rankings through an authenticated server boundary without recalculating Elo client-side", () => {
    const server = source("./lib/elo-explorer.functions.ts");
    expect(server).toContain('createServerFn({ method: "GET" })');
    expect(server).toContain(".middleware([requireSupabaseAuth])");
    expect(server).toContain('from("elo_global_team_ratings")');
    expect(server).toContain('from("elo_league_ratings")');
    expect(server).toContain('from("elo_fixture_history")');
  });

  it("uses a single current league context per club in the global ranking read model", () => {
    const migration = source("../supabase/migrations/20260920190000_elo_current_team_rating_v1.sql");
    expect(migration).toContain("partition by t.team_id");
    expect(migration).toContain("t.last_fixture_at desc nulls last");
    expect(migration).toContain("where t.current_rank=1");
    expect(migration).toContain("l.rating + (t.local_rating - 1500::numeric)");
  });

  it("prioritizes the ranking before summary metrics", () => {
    const route = source("./routes/elo.tsx");
    expect(route.indexOf('title={mode === "TEAMS" ? "Ranking de clubes" : "Ranking de ligas"}')).toBeGreaterThan(-1);
    expect(route.indexOf('aria-label="Resumo do universo Elo"')).toBeGreaterThan(-1);
    expect(route.indexOf('title={mode === "TEAMS" ? "Ranking de clubes" : "Ranking de ligas"}')).toBeLessThan(route.indexOf('aria-label="Resumo do universo Elo"'));
  });

  it("preserves global positions when region, country or search filters are active", () => {
    const route = source("./routes/elo.tsx");
    expect(route).toContain("const teamRankById = useMemo");
    expect(route).toContain("const leagueRankById = useMemo");
    expect(route).toContain("const teamId = team.team_id;");
    expect(route).toContain("const selectable = teamId !== null;");
    expect(route).toContain("selectable ? teamRankById.get(teamId)");
    expect(route).toContain("leagueRankById.get(league.league_id)");
    expect(route).toContain("na ordem do ranking global");
  });

  it("makes active filtering clear and offers an explicit reset", () => {
    const route = source("./routes/elo.tsx");
    expect(route).toContain("{visibleCount} de {totalCount}");
    expect(route).toContain("Limpar filtros");
    expect(route).toContain('setRegion("ALL")');
    expect(route).toContain('setCountry("ALL")');
    expect(route).toContain('setSearch("")');
  });

  it("gives the selected team a direct path to its point-in-time history", () => {
    const route = source("./routes/elo.tsx");
    expect(route).toContain("Clube selecionado");
    expect(route).toContain('href="#elo-history"');
    expect(route).toContain("Ver histórico de 60 dias");
    expect(route).toContain('id="elo-history"');
    expect(route).toContain("<EloHistoryPanel");
  });

  it("keeps mobile rows touchable and exposes an accessible selection label", () => {
    const route = source("./routes/elo.tsx");
    expect(route).toContain("min-h-12 w-full");
    expect(route).toContain("aria-label={`Selecionar ${team.team_name} para consultar o histórico Elo`}");
  });
});
