import { describe, expect, it } from "vitest";

import type { FiveDollarFixture } from "@/lib/adapters/five_dollar.parse";
import {
  selectRecentFormFixtures,
  teamsNeedingRecentFormSupplement,
} from "./five-dollar-sports-sync.server";

function fixture(
  eventId: number,
  startTimestamp: number,
  homeTeamId: number,
  awayTeamId: number,
): FiveDollarFixture {
  return {
    eventId,
    startTimestamp,
    homeTeamId,
    awayTeamId,
  } as FiveDollarFixture;
}

describe("recent-form history selection", () => {
  it("keeps only the latest fixtures needed by each target team and deduplicates shared matches", () => {
    const fixtures = [
      fixture(1, 100, 10, 20),
      fixture(2, 200, 10, 30),
      fixture(3, 300, 10, 40),
      fixture(4, 400, 10, 50),
      fixture(5, 500, 10, 60),
      fixture(6, 600, 10, 20),
      fixture(7, 700, 20, 70),
    ];

    const selected = selectRecentFormFixtures(fixtures, [10, 20], 2);

    expect(selected.map((item) => item.eventId)).toEqual([7, 6, 5]);
  });

  it("identifies only teams that still need cross-competition supplementation", () => {
    const fixtures = [
      fixture(1, 100, 10, 21),
      fixture(2, 200, 10, 22),
      fixture(3, 300, 10, 23),
      fixture(4, 400, 10, 24),
      fixture(5, 500, 10, 25),
      fixture(6, 600, 20, 31),
      fixture(7, 700, 20, 32),
      fixture(8, 800, 20, 33),
      fixture(9, 900, 20, 34),
    ];

    expect(teamsNeedingRecentFormSupplement(fixtures, [10, 20], 5)).toEqual([20]);
  });

  it("bounds the per-team request to at most ten fixtures", () => {
    const fixtures = Array.from({ length: 12 }, (_, index) =>
      fixture(index + 1, index + 1, 10, 100 + index),
    );

    expect(selectRecentFormFixtures(fixtures, [10], 50)).toHaveLength(10);
  });
});
