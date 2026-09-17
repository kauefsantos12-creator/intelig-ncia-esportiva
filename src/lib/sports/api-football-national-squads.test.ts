import { describe, expect, it } from "vitest";

import {
  NATIONAL_LEAGUE_TARGETS,
  normalizeTeamName,
  teamNameScore,
} from "./api-football-national-squads.server";

describe("national squad backfill scope", () => {
  it("contains only the six approved domestic top leagues", () => {
    expect(NATIONAL_LEAGUE_TARGETS.map((item) => item.leagueId).sort((a, b) => a - b)).toEqual([
      39, 61, 71, 78, 135, 140,
    ]);
    expect(NATIONAL_LEAGUE_TARGETS.map((item) => item.countryCode).sort()).toEqual([
      "BR", "DE", "ES", "FR", "GB-ENG", "IT",
    ]);
    expect(NATIONAL_LEAGUE_TARGETS.map((item) => item.fiveDollarLeagueId).sort((a, b) => a - b)).toEqual([
      686337048, 3118717965, 3405541143, 3614399544, 4160026622, 4212821298,
    ]);
  });

  it("keeps the Brazilian league in South America and European leagues in Europe", () => {
    const brazil = NATIONAL_LEAGUE_TARGETS.find((item) => item.countryCode === "BR");
    expect(brazil?.region).toBe("SOUTH_AMERICA");
    expect(NATIONAL_LEAGUE_TARGETS.filter((item) => item.countryCode !== "BR").every((item) => item.region === "EUROPE")).toBe(true);
  });
});

describe("cross-provider team-name matching", () => {
  it("normalizes provider suffixes and accents", () => {
    expect(normalizeTeamName("Atlético Mineiro FC")).toBe("atletico mineiro");
    expect(teamNameScore("Athletic Bilbao", "Athletic Club")).toBeGreaterThan(0.45);
  });

  it("keeps unrelated teams apart", () => {
    expect(teamNameScore("Real Sociedad", "Real Madrid")).toBeLessThan(0.72);
  });
});
