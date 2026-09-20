import { describe, expect, it } from "vitest";

import {
  extractSofaScoreCuratedStats,
  sofaTeamNameScore,
} from "./sofascore-editorial-sync.server";

describe("SofaScore editorial sync", () => {
  it("matches common club-name variants conservatively", () => {
    expect(sofaTeamNameScore("Bayern Munich", "FC Bayern München")).toBe(1);
    expect(sofaTeamNameScore("NY Red Bulls", "New York Red Bulls")).toBe(1);
    expect(sofaTeamNameScore("Palmeiras", "SE Palmeiras")).toBe(1);
    expect(sofaTeamNameScore("Chelsea", "Arsenal")).toBeLessThan(0.5);
  });

  it("extracts only the full-match editorial metrics used by the briefing", () => {
    const stats = extractSofaScoreCuratedStats({
      statistics: [
        {
          period: "ALL",
          groups: [
            {
              groupName: "Match overview",
              statisticsItems: [
                { name: "Expected goals", key: "expectedGoals", home: "1.42", away: "1.04", homeValue: 1.42, awayValue: 1.04 },
                { name: "Shots on target", key: "shotsOnTarget", home: "6", away: "4", homeValue: 6, awayValue: 4 },
                { name: "Ball possession", key: "ballPossession", home: "50%", away: "50%", homeValue: 50, awayValue: 50 },
                { name: "Corner kicks", key: "cornerKicks", home: "2", away: "8", homeValue: 2, awayValue: 8 },
                { name: "Total shots", key: "totalShots", home: "9", away: "12", homeValue: 9, awayValue: 12 },
              ],
            },
          ],
        },
        {
          period: "1ST",
          groups: [
            {
              groupName: "Match overview",
              statisticsItems: [
                { name: "Shots on target", key: "shotsOnTarget", homeValue: 2, awayValue: 1 },
              ],
            },
          ],
        },
      ],
    });

    expect(stats.expectedGoals).toEqual({ home: 1.42, away: 1.04 });
    expect(stats.shotsOnTarget).toEqual({ home: 6, away: 4 });
    expect(stats.possession).toEqual({ home: 50, away: 50 });
    expect(stats.corners).toEqual({ home: 2, away: 8 });
    expect(stats.totalShots).toEqual({ home: 9, away: 12 });
  });
});
