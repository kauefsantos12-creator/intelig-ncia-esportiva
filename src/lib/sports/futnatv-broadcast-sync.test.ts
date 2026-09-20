import { describe, expect, it } from "vitest";

import { parseFutebolTvListings, parseFutNaTvListings, teamNameScore } from "./futnatv-broadcast-sync.server";

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


describe("Futebol na TV fallback parsing", () => {
  it("parses the fallback fixture structure and all channel pills", () => {
    const html = `
      <article class="fixture-row relative grid gap-4">
        <a href="https://futebol.tv.br/jogo/gremio-x-palmeiras"
           aria-label="Ver detalhes de Grêmio x Palmeiras"></a>
        <time datetime="2026-09-20T11:00:00-03:00">11:00</time>
        <div>
          <span class="channel-pill inline-flex"><span>▻</span>Premiere</span>
        </div>
      </article>
      <article class="fixture-row relative grid gap-4">
        <a href="https://futebol.tv.br/jogo/corinthians-x-fluminense"
           aria-label="Ver detalhes de Corinthians x Fluminense"></a>
        <time datetime="2026-09-20T16:00:00-03:00">16:00</time>
        <div>
          <span class="channel-pill inline-flex"><span>▻</span>Premiere</span>
          <span class="channel-pill inline-flex"><span>▻</span>Rede Globo</span>
        </div>
      </article>
    `;

    expect(parseFutebolTvListings(html)).toEqual([
      {
        home: "Grêmio",
        away: "Palmeiras",
        kickoffLabel: "11h00",
        broadcastRaw: "Premiere",
        broadcasters: ["Premiere"],
      },
      {
        home: "Corinthians",
        away: "Fluminense",
        kickoffLabel: "16h00",
        broadcastRaw: "Premiere, Rede Globo",
        broadcasters: ["Premiere", "Rede Globo"],
      },
    ]);
  });
});
