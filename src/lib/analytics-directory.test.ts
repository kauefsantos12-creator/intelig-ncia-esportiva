import { describe, expect, it } from "vitest";

import { buildAnalyticsMemberships } from "./analytics-directory";

describe("analytics directory memberships", () => {
  it("remains navigable when standings are empty", () => {
    const memberships = buildAnalyticsMemberships(
      [
        { competition_id: "competition-a", home_team_id: "team-a", away_team_id: "team-b" },
        { competition_id: "competition-a", home_team_id: "team-b", away_team_id: "team-c" },
      ],
      [],
    );

    expect(memberships).toEqual([
      { competitionId: "competition-a", teamId: "team-a" },
      { competitionId: "competition-a", teamId: "team-b" },
      { competitionId: "competition-a", teamId: "team-c" },
    ]);
  });

  it("deduplicates fixture and standing membership", () => {
    const memberships = buildAnalyticsMemberships(
      [{ competition_id: "competition-a", home_team_id: "team-a", away_team_id: "team-b" }],
      [
        { competition_id: "competition-a", team_id: "team-a" },
        { competition_id: "competition-a", team_id: "team-c" },
      ],
    );

    expect(memberships).toHaveLength(3);
    expect(memberships).toContainEqual({ competitionId: "competition-a", teamId: "team-c" });
  });
});
