import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("Noticiário sports intelligence contract", () => {
  it("loads news data only through an authenticated server boundary", () => {
    const server = source("./lib/news-overview.functions.ts");
    expect(server).toContain('createServerFn({ method: "GET" })');
    expect(server).toContain(".middleware([requireSupabaseAuth])");
    expect(server).toContain("if (!context.userId)");
    expect(server).toContain("await adminDb()");
  });

  it("uses canonical sports data and published briefings without client-side synthesis", () => {
    const server = source("./lib/news-overview.functions.ts");
    expect(server).toContain('from("sports_daily_briefings")');
    expect(server).toContain('.eq("status", "PUBLISHED")');
    expect(server).toContain('from("sports_briefing_items")');
    expect(server).toContain('from("sports_fixtures")');
    expect(server).toContain('.eq("status", "FINISHED")');
    expect(server).toContain('from("elo_fixture_history")');
    expect(server).not.toContain("fetch(");
    expect(server).toContain("editorial_payload");
    expect(server).toContain("parseSchedule");
  });

  it("filters factual result fallbacks through canonical always-track rules", () => {
    const server = source("./lib/news-overview.functions.ts");
    expect(server).toContain('from("sports_tracking_rules")');
    expect(server).toContain('.eq("enabled", true)');
    expect(server).toContain('.eq("always_track", true)');
    expect(server).toContain("matchesTrackingRule");
    expect(server).toContain("trackingRules.some");
  });

  it("limits fallback context to a recent factual window", () => {
    const server = source("./lib/news-overview.functions.ts");
    expect(server).toContain("48 * 60 * 60 * 1000");
    expect(server).toContain("Math.abs(movement.delta) >= 2");
    expect(server).toContain(".slice(0, 8)");
  });

  it("renders published editorial content separately from factual fallbacks", () => {
    const route = source("./routes/index.tsx");
    expect(route).toContain("useServerFn(getNewsOverview)");
    expect(route).toContain("A resenha ainda não foi publicada");
    expect(route).toContain("Resultados recentes");
    expect(route).toContain("Movimentos de Elo");
    expect(route).toContain("Fatos verificados até");
    expect(route).not.toContain("Mandante × Visitante");
  });

  it("keeps the briefing as the primary reading surface and renders the editorial hierarchy as an article", () => {
    const route = source("./routes/index.tsx");
    expect(route).toContain("function briefingTitle");
    expect(route).toContain("Resenha de ontem —");
    expect(route).toContain('title={briefing?briefingTitle(briefing.date,overview.observedAt):"Resenha esportiva"}');
    expect(route.indexOf('description="Leitura editorial diária')).toBeGreaterThan(-1);
    expect(route.indexOf('title="Resultados recentes"')).toBeGreaterThan(-1);
    expect(route.indexOf('title="Movimentos de Elo"')).toBeGreaterThan(-1);
    expect(route.indexOf('description="Leitura editorial diária')).toBeLessThan(route.indexOf('title="Resultados recentes"'));
    expect(route).toContain("max-w-[72ch]");
    expect(route).toContain("function EditorialItem");
    expect(route).toContain("Contexto do dia");
    expect(route).toContain("Destaques de ontem");
    expect(route).toContain("Outros esportes de ontem");
    expect(route).toContain("Palmeiras");
    expect(route).toContain("Ontem após 21h");
    expect(route).toContain("Programação de hoje");
    expect(route).toContain("Onde assistir:");
    expect(route).not.toContain("<CollapsiblePanel");
  });

  it("keeps recent results scannable with real team logos and local-day grouping", () => {
    const route = source("./routes/index.tsx");
    expect(route).toContain("function ResultTeam");
    expect(route).toContain("result.homeTeamLogo");
    expect(route).toContain("result.awayTeamLogo");
    expect(route).toContain('loading="lazy"');
    expect(route).toContain("groupedResults");
    expect(route).toContain('"Hoje"');
    expect(route).toContain('"Ontem"');
  });

  it("keeps secondary factual context visible but subordinate", () => {
    const route = source("./routes/index.tsx");
    expect(route).toContain("overview.recentResults.length");
    expect(route).toContain("overview.eloMovements.length");
    expect(route).toContain("xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]");
    expect(route).not.toContain("xl:sticky xl:top-24");
    expect(route).toContain("Aguardando publicação");
    expect(route).toContain("Publicada");
  });

  it("keeps loading, retry and refresh states explicit", () => {
    const route = source("./routes/index.tsx");
    expect(route).toContain("<LoadingState");
    expect(route).toContain("<ErrorState");
    expect(route).toContain("onRetry={()=>void refresh()}");
    expect(route).toContain("Atualizar");
  });
});
