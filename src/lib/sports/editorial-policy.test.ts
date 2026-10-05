import { describe, expect, it } from "vitest";
import {
  approvedEditorialPublisher,
  EDITORIAL_PUBLISHERS,
  sofaScoreEditorialStats,
} from "./editorial-policy";

describe("approved editorial evidence", () => {
  it("restricts the catalog to the two selected publishers in each country", () => {
    const countries = ["DE", "ES", "GB-ENG", "FR", "IT", "PT", "BR"];
    expect(EDITORIAL_PUBLISHERS).toHaveLength(14);
    for (const country of countries) {
      const publishers = EDITORIAL_PUBLISHERS.filter((publisher) => publisher.country === country);
      expect(publishers).toHaveLength(2);
      expect(publishers.filter((publisher) => publisher.primary)).toHaveLength(1);
    }
  });

  it("requires both publisher attribution and an approved host", () => {
    expect(
      approvedEditorialPublisher("BBC", "https://www.bbc.co.uk/sport/football/article")?.source,
    ).toBe("BBC Sport");
    expect(
      approvedEditorialPublisher("L’Équipe", "https://www.lequipe.fr/Football/article")?.country,
    ).toBe("FR");
    expect(approvedEditorialPublisher("AS", "https://as.com.attacker.test/article")).toBeNull();
    expect(approvedEditorialPublisher("AS", "https://marca.com/article")).toBeNull();
    expect(approvedEditorialPublisher("Unapproved paper", "https://as.com/article")).toBeNull();
    expect(approvedEditorialPublisher("AS", "javascript:alert(1)")).toBeNull();
  });

  it("omits other providers and missing metrics instead of estimating them", () => {
    const values = { possession: { home: 60, away: 40 }, expectedGoals: null };
    expect(sofaScoreEditorialStats({ source: "5DollarFootballAPI", values })).toBeNull();
    expect(sofaScoreEditorialStats({ source: "API-Football", values })).toBeNull();
    expect(sofaScoreEditorialStats({ source: "SofaScore", values })).toEqual({
      possession: { home: 60, away: 40 },
    });
    expect(sofaScoreEditorialStats({ source: "SofaScore", values: {} })).toBeNull();
  });

  it("preserves verified zero values and drops incomplete or non-finite pairs", () => {
    expect(
      sofaScoreEditorialStats({
        source: "SofaScore",
        values: {
          expectedGoals: { home: 0, away: 0.5 },
          shotsOnTarget: { home: 3 },
          possession: { home: Number.NaN, away: 40 },
          inventedMetric: { home: 4, away: 8 },
        },
      }),
    ).toEqual({ expectedGoals: { home: 0, away: 0.5 } });
  });
});
