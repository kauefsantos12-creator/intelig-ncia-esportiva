import { describe, expect, it } from "vitest";

import {
  belongsToPreviousSportsDay,
  editorialFixtureMatchScore,
  parseEditorialRss,
} from "./editorial-source-sync.server";

describe("editorial source sync", () => {
  it("parses RSS items and preserves source attribution", () => {
    const xml = `<?xml version="1.0"?><rss><channel><item>
      <title>Bayern reage após vitória - Sky Sports</title>
      <link>https://example.test/bayern</link>
      <guid>abc-1</guid>
      <pubDate>Fri, 18 Sep 2026 22:10:00 GMT</pubDate>
      <source>Sky Sports</source>
      <description><![CDATA[Resumo factual curto.]]></description>
    </item></channel></rss>`;
    expect(parseEditorialRss(xml, "Fallback")).toEqual([
      expect.objectContaining({
        guid: "abc-1",
        title: "Bayern reage após vitória",
        link: "https://example.test/bayern",
        sourceName: "Sky Sports",
      }),
    ]);
  });

  it("matches a one-team headline conservatively to the canonical fixture", () => {
    expect(editorialFixtureMatchScore(
      "Bayern Munich goleia e estabelece novo recorde",
      "Bayern Munich",
      "Union Berlin",
    )).toBeGreaterThanOrEqual(0.58);
  });

  it("prefers two-team evidence when both clubs are present", () => {
    const both = editorialFixtureMatchScore(
      "Brentford vence Chelsea no dérbi de Londres",
      "Brentford",
      "Chelsea",
    );
    const one = editorialFixtureMatchScore(
      "Brentford comemora vitória",
      "Brentford",
      "Chelsea",
    );
    expect(both).toBeGreaterThan(one);
  });

  it("rejects unrelated headlines", () => {
    expect(editorialFixtureMatchScore(
      "Djokovic avança no torneio de tênis",
      "Monaco",
      "Lens",
    )).toBeLessThan(0.58);
  });

  it("uses the São Paulo local sports day", () => {
    expect(belongsToPreviousSportsDay("2026-09-18", "2026-09-19T01:30:00.000Z")).toBe(true);
    expect(belongsToPreviousSportsDay("2026-09-18", "2026-09-19T04:30:00.000Z")).toBe(false);
  });
});
