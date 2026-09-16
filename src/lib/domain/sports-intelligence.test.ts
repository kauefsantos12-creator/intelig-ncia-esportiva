import { describe, expect, it } from "vitest";

import {
  actualScore,
  calculateAdjustedMoment,
  detectStreaks,
  eloExpectedScore,
  eloMovement,
  relativeToCompetition,
  summarizeForm,
  type TeamMatchSnapshot,
} from "./sports-intelligence";

const baseMatch = (overrides: Partial<TeamMatchSnapshot> = {}): TeamMatchSnapshot => ({
  kickoffAt: "2026-09-10T19:00:00.000Z",
  goalsFor: 2,
  goalsAgainst: 1,
  teamEloBefore: 1700,
  opponentEloBefore: 1700,
  venue: "NEUTRAL",
  ...overrides,
});

describe("sports intelligence calculations", () => {
  it("keeps neutral Elo expectation symmetric and applies home advantage", () => {
    expect(eloExpectedScore(1700, 1700, "NEUTRAL")).toBeCloseTo(0.5, 6);
    expect(eloExpectedScore(1700, 1700, "HOME")).toBeGreaterThan(0.5);
    expect(eloExpectedScore(1700, 1700, "AWAY")).toBeLessThan(0.5);
  });

  it("maps football results to Elo scores", () => {
    expect(actualScore(2, 0)).toBe(1);
    expect(actualScore(1, 1)).toBe(0.5);
    expect(actualScore(0, 3)).toBe(0);
  });

  it("summarizes form and preserves missing optional metrics", () => {
    const summary = summarizeForm([
      baseMatch({ goalsFor: 2, goalsAgainst: 0, opponentEloBefore: 1800, shotsOnTargetFor: 6 }),
      baseMatch({ goalsFor: 1, goalsAgainst: 1, opponentEloBefore: 1600, shotsOnTargetFor: 4 }),
      baseMatch({ goalsFor: 0, goalsAgainst: 1, opponentEloBefore: 1700, shotsOnTargetFor: null }),
    ]);

    expect(summary.wins).toBe(1);
    expect(summary.draws).toBe(1);
    expect(summary.losses).toBe(1);
    expect(summary.goalsPerMatch).toBeCloseTo(1, 6);
    expect(summary.avgOpponentElo).toBeCloseTo(1700, 6);
    expect(summary.avgShotsOnTargetFor).toBeCloseTo(5, 6);
  });

  it("measures performance against Elo expectation instead of raw win rate", () => {
    const now = new Date("2026-09-15T12:00:00.000Z");
    const strongUpset = baseMatch({
      kickoffAt: "2026-09-14T12:00:00.000Z",
      teamEloBefore: 1600,
      opponentEloBefore: 1850,
      goalsFor: 2,
      goalsAgainst: 1,
      venue: "AWAY",
    });
    const routineWin = baseMatch({
      kickoffAt: "2026-09-14T12:00:00.000Z",
      teamEloBefore: 1850,
      opponentEloBefore: 1550,
      goalsFor: 2,
      goalsAgainst: 1,
      venue: "HOME",
    });

    const upsetMoment = calculateAdjustedMoment([strongUpset], now);
    const routineMoment = calculateAdjustedMoment([routineWin], now);
    expect(upsetMoment.performanceVsExpectation ?? 0).toBeGreaterThan(routineMoment.performanceVsExpectation ?? 0);
  });

  it("detects only streaks that meet the product thresholds", () => {
    const matches = Array.from({ length: 5 }, (_, index) =>
      baseMatch({
        kickoffAt: `2026-09-${String(15 - index).padStart(2, "0")}T12:00:00.000Z`,
        goalsFor: 2,
        goalsAgainst: index < 3 ? 0 : 1,
      }),
    );
    const streaks = detectStreaks(matches);

    expect(streaks).toEqual(expect.arrayContaining([
      { key: "UNBEATEN_STREAK", matches: 5 },
      { key: "WIN_STREAK", matches: 5 },
      { key: "SCORING_STREAK", matches: 5 },
    ]));
    expect(streaks.some((item) => item.key === "CLEAN_SHEET_STREAK")).toBe(true);
  });

  it("normalizes metrics to the competition baseline", () => {
    const normalized = relativeToCompetition(6, 5);
    expect(normalized.ratio).toBeCloseTo(1.2, 10);
    expect(normalized.pctDifference).toBeCloseTo(0.2, 10);
    expect(relativeToCompetition(6, 0)).toEqual({ ratio: null, pctDifference: null });
  });

  it("flags only meaningful Elo movements", () => {
    expect(eloMovement(1750, 1710, 25)).toEqual({ delta: 40, significant: true });
    expect(eloMovement(1750, 1740, 25)).toEqual({ delta: 10, significant: false });
  });
});
