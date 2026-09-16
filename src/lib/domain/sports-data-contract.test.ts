import { describe, expect, it } from "vitest";

import {
  fixtureIdentityKey,
  freshnessState,
  normalizeFixtureStatus,
  sportsJobIdempotencyKey,
} from "./sports-data-contract";

describe("canonical sports data contracts", () => {
  it("builds stable fixture and job idempotency keys", () => {
    const fixtureKey = fixtureIdentityKey({
      primaryProvider: "five_dollar",
      primaryFixtureId: 12345,
      kickoffAt: "2026-09-15T19:00:00Z",
      homeTeamId: 1,
      awayTeamId: 2,
    });
    expect(fixtureKey).toBe("five_dollar:12345");
    expect(sportsJobIdempotencyKey("PLAYER SYNC", fixtureKey)).toBe("player-sync:five_dollar:12345:v1");
  });

  it("normalizes provider statuses without guessing unknown values", () => {
    expect(normalizeFixtureStatus("FT")).toBe("FINISHED");
    expect(normalizeFixtureStatus("2H")).toBe("LIVE");
    expect(normalizeFixtureStatus("NS")).toBe("SCHEDULED");
    expect(normalizeFixtureStatus("PST")).toBe("POSTPONED");
    expect(normalizeFixtureStatus("CANC")).toBe("CANCELLED");
    expect(normalizeFixtureStatus("provider_new_status")).toBe("UNKNOWN");
  });

  it("classifies data freshness with explicit stale and expired states", () => {
    const now = new Date("2026-09-15T12:00:00Z");
    expect(freshnessState("2026-09-15T11:58:00Z", "FIXTURE", now)).toBe("FRESH");
    expect(freshnessState("2026-09-15T11:50:00Z", "FIXTURE", now)).toBe("STALE_REVALIDATE");
    expect(freshnessState("2026-09-15T10:00:00Z", "FIXTURE", now)).toBe("EXPIRED");
    expect(freshnessState("invalid", "FIXTURE", now)).toBe("INVALID");
  });
});
