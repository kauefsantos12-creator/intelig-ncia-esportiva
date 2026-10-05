import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ sportsDb: vi.fn() }));
vi.mock("./sports-db.server", () => ({ sportsDb: mocks.sportsDb }));
import { refineSportsDailyBriefingWithAi } from "./editorial-ai-refinement.server";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("editorial refinement evidence boundary", () => {
  it("filters provider statistics and publisher context before generating, then preserves paragraphs and match identity", async () => {
    const updates: Array<{ table: string; value: Record<string, unknown> }> = [];
    const filters: Array<{ table: string; field: string; value: unknown }> = [];
    const row = {
      id: "item-1",
      fixture_id: "fixture-1",
      item_kind: "FOOTBALL_MATCH",
      title: "Barcelona 7 × 0 Real Madrid",
      body: "Barcelona venceu por 7 a 0.",
      priority: 100,
      facts: {
        score: { home: 7, away: 0 },
        competition: "Liga F",
        editorialStats: {
          source: "5DollarFootballAPI",
          values: { possession: { home: 66, away: 34 } },
        },
        journalismContext: [
          { source: "AS", sourceUrl: "https://as.com/futbol/exemplo", title: "Pina marca quatro" },
          {
            source: "Unknown paper",
            sourceUrl: "https://outside.test/report",
            title: "Unsupported interpretation",
          },
        ],
      },
      provenance: [],
    };
    mocks.sportsDb.mockResolvedValue({
      from(table: string) {
        const data = table === "sports_briefing_items" ? [row] : [];
        const query = {
          select: () => query,
          order: () => query,
          in: () => query,
          eq(field: string, value: unknown) {
            filters.push({ table, field, value });
            return query;
          },
          limit: () => Promise.resolve({ data, error: null }),
          maybeSingle: () =>
            Promise.resolve({
              data: { id: "briefing-1", status: "READY", metadata: {} },
              error: null,
            }),
          update(value: Record<string, unknown>) {
            updates.push({ table, value });
            return query;
          },
          then(resolve: (value: { data: unknown[]; error: null }) => unknown) {
            return Promise.resolve(resolve({ data, error: null }));
          },
        };
        return query;
      },
    });
    vi.stubEnv("LOVABLE_API_KEY", "unit-test-only");
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    opening: "O clássico marcou o dia.",
                    items: [
                      {
                        id: "item-1",
                        title: "Pina conduz a goleada",
                        body: "Pina marcou quatro vezes.\n\nO Barcelona venceu o clássico.",
                      },
                    ],
                  }),
                },
              },
            ],
          }),
          { status: 200 },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await refineSportsDailyBriefingWithAi("2026-10-04");
    expect(result.status).toBe("REFINED");
    const request = JSON.parse(
      String(
        (fetchMock.mock.calls[0] as unknown[])[1] &&
          ((fetchMock.mock.calls[0] as unknown[])[1] as RequestInit).body,
      ),
    );
    const payload = JSON.parse(request.messages[1].content);
    expect(payload.items[0].matchStats).toBeNull();
    expect(payload.items[0].sourceHeadlines).toEqual([expect.objectContaining({ source: "AS" })]);
    expect(payload.editionOverview).toHaveLength(1);
    expect(filters).toContainEqual({
      table: "sports_fixture_player_stats",
      field: "provider",
      value: "sofascore",
    });
    const itemUpdate = updates.find((update) => update.table === "sports_briefing_items")!.value;
    expect(itemUpdate["body"]).toBe("Pina marcou quatro vezes.\n\nO Barcelona venceu o clássico.");
    expect(itemUpdate["title"]).toBe("Pina conduz a goleada");
    expect(itemUpdate["facts"]).toMatchObject({
      matchLabel: "Barcelona 7 × 0 Real Madrid",
      aiEditorial: { version: "editorial-explanatory-v3" },
    });
  });
});
