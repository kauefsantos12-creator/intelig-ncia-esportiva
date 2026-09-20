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

  it("exposes the real daily snapshot reference instead of treating page load as Elo generation time", () => {
    const server = source("./lib/elo-explorer.functions.ts");
    const route = source("./routes/elo.tsx");

    expect(server).toContain('from("elo_sync_state")');
    expect(server).toContain('"last_completed_at,last_status,details"');
    expect(server).toContain("latestTeamFixture");
    expect(server).toContain('cadence: "DAILY_0505_AMERICA_SAO_PAULO"');
    expect(server).toContain("requestedAt: new Date().toISOString()");
    expect(server).not.toContain("generatedAt: new Date().toISOString()");

    expect(route).toContain('aria-label="Referência temporal do Elo"');
    expect(route).toContain("Snapshot fechado");
    expect(route).toContain("Partidas consideradas até");
    expect(route).toContain("Cobertura da rodada");
    expect(route).toContain("Fechamento diário · 05:05");
    expect(route).toContain("Jogos encerrados depois do fechamento entram no próximo processamento das 05:05 de Brasília.");
  });

  it("prioritizes the ranking before summary metrics", () => {
    const route = source("./routes/elo.tsx");
    expect(route.indexOf('title={mode === "TEAMS" ? "Ranking de clubes" : "Ranking de ligas"}')).toBeGreaterThan(-1);
    expect(route.indexOf('aria-label="Resumo do universo Elo"')).toBeGreaterThan(-1);
    expect(route.indexOf('title={mode === "TEAMS" ? "Ranking de clubes" : "Ranking de ligas"}')).toBeLessThan(route.indexOf('aria-label="Resumo do universo Elo"'));
  });

  it("preserves real global positions while filters, sorting and pagination are active", () => {
    const route = source("./routes/elo.tsx");
    expect(route).toContain("const teamRankById = useMemo");
    expect(route).toContain("const leagueRankById = useMemo");
    expect(route).toContain("const teamId = team.team_id;");
    expect(route).toContain("const selectable = teamId !== null;");
    expect(route).toContain("selectable ? teamRankById.get(teamId)");
    expect(route).toContain("leagueRankById.get(league.league_id)");
    expect(route).toContain('<option value="RANK">Posição global</option>');
  });

  it("supports the planned table filters and deterministic sorting", () => {
    const route = source("./routes/elo.tsx");
    expect(route).toContain('label="Filtrar por país"');
    expect(route).toContain('label="Filtrar por liga"');
    expect(route).toContain('label="Filtrar por divisão"');
    expect(route).toContain('label="Ordenar ranking"');
    expect(route).toContain('if (league !== "ALL" && String(team.league_id) !== league)');
    expect(route).toContain('if (division !== "ALL" && String(team.divisionLevel) !== division)');
    expect(route).toContain('sort === "MATCHES_DESC"');
    expect(route).toContain('sort === "COUNTRY_ASC"');
    expect(route).toContain('sort === "DIVISION_ASC"');
  });

  it("paginates the complete ranking instead of silently truncating after 100 rows", () => {
    const route = source("./routes/elo.tsx");
    expect(route).toContain("const PAGE_SIZE = 50");
    expect(route).toContain("const pagedTeams = filteredTeams.slice(pageStart, pageEnd)");
    expect(route).toContain("const pagedLeagues = filteredLeagues.slice(pageStart, pageEnd)");
    expect(route).toContain('aria-label="Paginação do ranking Elo"');
    expect(route).toContain("Página {currentPage} de {totalPages}");
    expect(route).not.toContain("filteredTeams.slice(0, 100)");
    expect(route).not.toContain("filteredLeagues.slice(0, 100)");
  });

  it("makes active filtering clear and offers an explicit reset", () => {
    const route = source("./routes/elo.tsx");
    expect(route).toContain("{visibleCount} de {totalCount}");
    expect(route).toContain("Limpar filtros");
    expect(route).toContain('setRegion("ALL")');
    expect(route).toContain('setCountry("ALL")');
    expect(route).toContain('setLeague("ALL")');
    expect(route).toContain('setDivision("ALL")');
    expect(route).toContain('setSort("RANK")');
    expect(route).toContain('setSearch("")');
    expect(route).toContain("Resultados ${pageStart + 1}–${pageEnd} de ${visibleCount}");
  });

  it("enriches the ranking with available team identity without making crests mandatory", () => {
    const server = source("./lib/elo-explorer.functions.ts");
    const route = source("./routes/elo.tsx");

    expect(server).toContain('from("sports_teams")');
    expect(server).toContain('"five_dollar_team_id,logo_url"');
    expect(server).toContain("if (!teamMediaResult.error)");
    expect(server).toContain("logoUrl:");

    expect(route).toContain("function TeamCrest");
    expect(route).toContain("onError={() => setLogoFailed(true)}");
    expect(route).toContain("initials || \"•\"");
    expect(route).toContain("function RankBadge");
    expect(route).toContain("Posição global ${rank}");
  });

  it("adds ranking context to selected clubs and mobile rows", () => {
    const route = source("./routes/elo.tsx");
    expect(route).toContain("jogos processados");
    expect(route).toContain("<TeamCrest team={selectedTeam} size=\"selected\" />");
    expect(route).toContain("<TeamCrest team={team} />");
    expect(route).toContain("team.matches_processed ?? 0");
    expect(route).toContain("ring-1 ring-inset ring-primary/20");
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
    expect(route).toContain("min-h-14 w-full");
    expect(route).toContain("aria-label={`Selecionar ${team.team_name} para consultar o histórico Elo`}");
  });
});
