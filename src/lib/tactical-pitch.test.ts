import { describe, expect, it } from "vitest";
import { buildPitch, formationLines } from "./tactical-pitch";
import { pitchRatingInput, ratingLabel } from "./pitch-rating";
import type { MyGameLineup, MyGamePlayer } from "./my-games";

function team(formation: string, positions: string[]): MyGameLineup["teams"][number] {
  return {
    id: "home",
    name: "Casa",
    formation,
    coach: null,
    players: positions.map((position, n): MyGamePlayer => ({
      id: String(n),
      teamId: "home",
      name: `Atleta ${n}`,
      number: n,
      position,
      role: "starter",
      source: "Informada",
      fetchedAt: "",
    })),
  };
}
describe("schematic tactical distribution", () => {
  it("reads formation lines without fabricating an invalid formation", () => {
    expect(formationLines("4–4–2")).toEqual([4, 4, 2]);
    expect(formationLines("1-4-2-3-1")).toEqual([4, 2, 3, 1]);
    for (const value of [null, "", "4-5-2", "0-5-5", "99", "4-4", "unknown"])
      expect(formationLines(value)).toBeNull();
  });
  it("places the 4-4-2 goalkeeper, defenders, midfield and attackers without duplicate players", () => {
    const source = team("4-4-2", [
      "GOL",
      "LAD",
      "ZAD",
      "ZAE",
      "LAE",
      "VOL",
      "VOL",
      "MEC",
      "MEC",
      "ATA",
      "ATA",
    ]);
    const result = buildPitch(source);
    expect(result.lines.map((l) => l.players.length)).toEqual([2, 4, 4, 1]);
    expect(result.lines[2]?.players.map((p) => p.position)).toEqual(["LAE", "ZAE", "ZAD", "LAD"]);
    expect(new Set(result.lines.flatMap((l) => l.players.map((p) => p.id))).size).toBe(11);
    expect(source.players[1]?.position).toBe("LAD");
  });
  it("keeps three center backs and moves wingbacks onto the five-player line in 3-5-2", () => {
    const result = buildPitch(
      team("3-5-2", ["GOL", "ZAD", "ZAG", "ZAE", "LAD", "LAE", "VOL", "VOL", "MEC", "ATA", "ATA"]),
    );
    expect(result.lines.map((l) => l.players.length)).toEqual([2, 5, 3, 1]);
    expect(result.lines[2]?.players.map((p) => p.position)).toEqual(["ZAE", "ZAG", "ZAD"]);
    expect(result.lines[1]?.players[0]?.position).toBe("LAE");
    expect(result.lines[1]?.players[4]?.position).toBe("LAD");
  });
  it("does not place substitutes, incomplete lineups or unknown keepers on a fabricated pitch", () => {
    const source = team("4-4-2", ["GOL", "D", "D", "D", "D", "M", "M", "M", "M", "F", "F"]);
    source.players.push({ ...source.players[1]!, id: "bench", role: "bench" });
    expect(
      buildPitch(source)
        .lines.flatMap((l) => l.players)
        .some((p) => p.id === "bench"),
    ).toBe(false);
    source.players[0] = { ...source.players[0]!, position: null };
    expect(buildPitch(source).lines).toEqual([]);
    expect(buildPitch({ ...source, players: source.players.slice(0, 8) }).reason).not.toBeNull();
  });
});
describe("personal pitch rating contract", () => {
  const input = {
    fixtureId: "12121212-1212-4212-8212-121212121212",
    playerId: "13131313-1313-4313-8313-131313131313",
    rating: 7.5,
    confirmed: true,
    expectedUpdatedAt: null,
  };
  it("requires observation and the existing half-point scale", () => {
    expect(pitchRatingInput.safeParse(input).success).toBe(true);
    for (const value of [-0.5, 7.1, 10.5, Number.NaN, Number.POSITIVE_INFINITY])
      expect(pitchRatingInput.safeParse({ ...input, rating: value }).success).toBe(false);
    expect(pitchRatingInput.safeParse({ ...input, confirmed: false }).success).toBe(false);
    expect(pitchRatingInput.safeParse({ ...input, rating: null, confirmed: false }).success).toBe(
      true,
    );
  });
  it("preserves zero and formats missing ratings without inventing a score", () => {
    expect(ratingLabel(0)).toBe("0,0");
    expect(ratingLabel(7.5)).toBe("7,5");
    expect(ratingLabel(null)).toBe("—");
  });
});
