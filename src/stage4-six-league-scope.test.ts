import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Stage 4 six-league enrichment scope", () => {
  const sql = fs.readFileSync(path.resolve("supabase/migrations/20260919101500_stage4_six_league_enrichment_scope.sql"), "utf8");

  it("limits detailed API-Football work to the six Stage 3 squad leagues", () => {
    for (const leagueId of [39, 61, 71, 78, 135, 140]) expect(sql).toContain(String(leagueId));
    expect(sql).not.toContain("competition_kind = 'CONTINENTAL'");
  });

  it("kills queued detailed work outside the scope", () => {
    expect(sql).toContain("API_FOOTBALL_FIXTURE_DATA");
    expect(sql).toContain("API_FOOTBALL_LINK");
    expect(sql).toContain("and not public.sports_fixture_in_api_football_scope(j.fixture_id)");
  });
  it("exempts only media-only team reconciliation from the fixture scope guard", () => {
    const mediaSql = fs.readFileSync(
      path.resolve("supabase/migrations/20260920174500_api_football_team_media_scope_exemption.sql"),
      "utf8",
    );
    expect(mediaSql).toContain("new.job_type <> 'API_FOOTBALL_TEAM_MEDIA_LINK'");
    expect(mediaSql).toContain("j.job_type = 'API_FOOTBALL_TEAM_MEDIA_LINK'");
    expect(mediaSql).not.toContain("API_FOOTBALL_FIXTURE_DATA' and new.job_type <>");
  });

});
