import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("stage 4 prospective fixture collection contract", () => {
  const sync = readFileSync("src/lib/sports/api-football-sports-sync.server.ts", "utf8");
  const quota = readFileSync("src/lib/sports/api-football-quota-sync.server.ts", "utf8");
  const five = readFileSync("src/lib/sports/five-dollar-sports-sync.server.ts", "utf8");
  const migration = readFileSync("supabase/migrations_archive/20260919090000_stage4_prospective_fixture_collection.sql", "utf8");

  it("uses fixture endpoints and persists per-fixture player data", () => {
    expect(sync).toContain("apiFootballFixtureLineups");
    expect(sync).toContain("apiFootballFixturePlayers");
    expect(sync).toContain('from("sports_fixture_player_stats").upsert');
    expect(five).toContain('from("sports_fixture_team_stats")');
  });

  it("keeps player-season outside the worker primary path", () => {
    expect(quota).toContain("apiFootballFixturePlayers");
    expect(quota).not.toContain("apiFootballPlayerSeason");
  });

  it("defines a day-zero boundary and fixture-derived aggregates", () => {
    expect(migration).toContain("sports_prospective_collection_state");
    expect(migration).toContain("f.kickoff_at >= s.day_zero_at");
    expect(migration).toContain("sports_player_period_aggregates");
  });
});
