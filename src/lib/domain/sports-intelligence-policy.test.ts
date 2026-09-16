import { describe, expect, it } from "vitest";

import {
  classifyPlayerParticipation,
  isAnnotationEligible,
  isValidPersonalRating,
  resolveBroadcastCandidates,
  shouldAutoCloseUnwatched,
  SPORTS_SEASON,
  teamPersonalRating,
} from "./sports-intelligence-policy";

describe("sports intelligence product policies", () => {
  it("locks the first product season", () => {
    expect(SPORTS_SEASON).toBe("2026/27");
  });

  it("prioritizes official broadcast evidence and preserves conflicts", () => {
    const resolved = resolveBroadcastCandidates([
      {
        broadcaster: "TNT",
        platform: "Max",
        sourceKind: "FUTNATV",
        sourceName: "FutNaTV",
        checkedAt: "2026-09-15T18:00:00Z",
      },
      {
        broadcaster: "TNT Sports",
        platform: "HBO Max",
        sourceKind: "OFFICIAL",
        sourceName: "TNT Sports",
        checkedAt: "2026-09-15T17:00:00Z",
      },
    ]);

    expect(resolved?.sourceKind).toBe("OFFICIAL");
    expect(resolved?.confidence).toBe(1);
    expect(resolved?.conflicts).toHaveLength(1);
  });

  it("allows annotations for broadcast games or always-track competitions", () => {
    expect(isAnnotationEligible({ hasBroadcastListing: true, alwaysTrack: false })).toBe(true);
    expect(isAnnotationEligible({ hasBroadcastListing: false, alwaysTrack: true })).toBe(true);
    expect(isAnnotationEligible({ hasBroadcastListing: false, alwaysTrack: false })).toBe(false);
  });

  it("classifies participation conservatively", () => {
    expect(classifyPlayerParticipation({ minutes: 65, matchFinished: true })).toBe("PARTICIPATED");
    expect(classifyPlayerParticipation({ minutes: 0, matchFinished: true })).toBe("DID_NOT_PLAY");
    expect(classifyPlayerParticipation({ minutes: null, inStartingXI: true, matchFinished: true })).toBe("PARTICIPATED");
    expect(classifyPlayerParticipation({ minutes: null, listedAsSubstitute: true, matchFinished: true })).toBe("UNKNOWN");
    expect(classifyPlayerParticipation({ minutes: 12, matchFinished: false })).toBe("UNKNOWN");
  });

  it("only exposes a team personal average when every participant is rated", () => {
    const incomplete = teamPersonalRating([
      { playerId: 1, participation: "PARTICIPATED", rating: 8 },
      { playerId: 2, participation: "PARTICIPATED", rating: null },
      { playerId: 3, participation: "DID_NOT_PLAY", rating: null },
    ]);
    expect(incomplete.complete).toBe(false);
    expect(incomplete.average).toBeNull();

    const complete = teamPersonalRating([
      { playerId: 1, participation: "PARTICIPATED", rating: 8 },
      { playerId: 2, participation: "PARTICIPATED", rating: 7.5 },
      { playerId: 3, participation: "DID_NOT_PLAY", rating: null },
    ]);
    expect(complete.complete).toBe(true);
    expect(complete.average).toBeCloseTo(7.75, 6);
    expect(complete.participants).toBe(2);
  });

  it("accepts only null or half-point personal ratings from zero to ten", () => {
    expect(isValidPersonalRating(null)).toBe(true);
    expect(isValidPersonalRating(0)).toBe(true);
    expect(isValidPersonalRating(7.5)).toBe(true);
    expect(isValidPersonalRating(10)).toBe(true);
    expect(isValidPersonalRating(7.3)).toBe(false);
    expect(isValidPersonalRating(10.5)).toBe(false);
  });

  it("auto-closes only finished pending matches before the cutoff", () => {
    expect(shouldAutoCloseUnwatched({
      matchFinished: true,
      reviewPending: true,
      finishedAt: "2026-09-15T23:55:00-03:00",
      cutoffAt: "2026-09-16T00:00:00-03:00",
    })).toBe(true);

    expect(shouldAutoCloseUnwatched({
      matchFinished: false,
      reviewPending: true,
      finishedAt: null,
      cutoffAt: "2026-09-16T00:00:00-03:00",
    })).toBe(false);
  });
});
