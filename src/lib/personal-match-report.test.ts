import { describe, expect, it } from "vitest";
import {
  fromBrazilDateTimeInput,
  personalMatchReportInput,
  toBrazilDateTimeInput,
} from "./personal-match-report";

describe("personal match report", () => {
  it("keeps the 20h kickoff in Brasília independently of the device timezone", () => {
    expect(fromBrazilDateTimeInput("2026-10-16T20:00")).toBe("2026-10-16T23:00:00.000Z");
    expect(toBrazilDateTimeInput("2026-10-16T23:00:00Z")).toBe("2026-10-16T20:00");
  });
  it("keeps the local date across UTC midnight", () => {
    expect(toBrazilDateTimeInput("2026-10-17T01:30:00Z")).toBe("2026-10-16T22:30");
    expect(fromBrazilDateTimeInput("2026-10-16T22:30")).toBe("2026-10-17T01:30:00.000Z");
  });
  it.each(["", "2026-02-30T20:00", "2026-10-16T25:00", "2026-10-16T20:70", "2026-10-16"])(
    "rejects invalid wall clocks: %s",
    (input) => {
      expect(() => fromBrazilDateTimeInput(input)).toThrow();
    },
  );
  const input = {
    id: "12345678-1234-4234-8234-123456789012",
    version: 0,
    homeTeam: " Clube A ",
    awayTeam: "Clube B",
    competition: null,
    kickoffAt: "2026-10-16T23:00:00Z",
    notes: "Linha 1\n  Linha 2",
  };
  it("allows an empty pre-game draft and preserves the user's text formatting", () => {
    expect(personalMatchReportInput.parse(input)).toMatchObject({
      homeTeam: "Clube A",
      notes: input.notes,
    });
    expect(personalMatchReportInput.parse({ ...input, notes: "" }).notes).toBe("");
  });
  it("rejects blank teams, overlong notes, and forged owner fields", () => {
    expect(personalMatchReportInput.safeParse({ ...input, homeTeam: "  " }).success).toBe(false);
    expect(personalMatchReportInput.safeParse({ ...input, notes: "a".repeat(4001) }).success).toBe(
      false,
    );
    expect(personalMatchReportInput.safeParse({ ...input, ownerId: "other-owner" }).success).toBe(
      false,
    );
  });
});
