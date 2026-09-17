import { describe, expect, it } from "vitest";

import { parseFutNaTvListings, teamNameScore } from "./futnatv-broadcast-sync.server";

describe("FutNaTV broadcast parsing", () => {
  it("parses a standard listing with multiple broadcasters", () => {
    const html = `
      <section>
        <div>Libertadores</div>
        <div>Quartas de Final - VOLTA</div>
        <div>00h30</div>
        <div>Flamengo</div>
        <div>x</div>
        <div>IDA 2x0</div>
        <div>Ind. del Valle</div>
        <div>ESPN e Disney+</div>
      </section>
    `;

    expect(parseFutNaTvListings(html)).toEqual([
      {
        home: "Flamengo",
        away: "Ind. del Valle",
        kickoffLabel: "00h30",
        broadcastRaw: "ESPN e Disney+",
        broadcasters: ["ESPN", "Disney+"],
      },
    ]);
  });

  it("ignores listings without a recognizable broadcaster", () => {
    const html = `
      <section>
        <div>19h00</div>
        <div>Time A</div>
        <div>x</div>
        <div>Time B</div>
        <div>Transmissão a definir</div>
      </section>
    `;

    expect(parseFutNaTvListings(html)).toEqual([]);
  });
});

describe("FutNaTV team matching", () => {
  it("matches common abbreviations used by the source", () => {
    expect(teamNameScore("Ind. del Valle", "Independiente del Valle")).toBeGreaterThanOrEqual(0.7);
  });

  it("does not confuse unrelated clubs", () => {
    expect(teamNameScore("Real Betis", "Real Sociedad")).toBeLessThan(0.7);
  });
});
