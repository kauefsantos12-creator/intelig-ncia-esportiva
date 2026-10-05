import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { rpc, fetchMock, maybeSingle } = vi.hoisted(() => ({
  rpc: vi.fn(),
  fetchMock: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    rpc,
    from: () => {
      const query = {
        select: () => query,
        eq: () => query,
        gt: () => query,
        maybeSingle,
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };
      return query;
    },
  },
}));

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-05T02:00:00Z"));
  vi.stubEnv("API_FOOTBALL_KEY", "test-key");
  vi.stubGlobal("fetch", fetchMock);
  rpc.mockReset();
  fetchMock.mockReset();
  maybeSingle.mockResolvedValue({ data: null, error: null });
  vi.spyOn(console, "info").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("API-Football shared pacing", () => {
  it.each(["denied", "unavailable"])("does not fetch with a %s shared permit", async (state) => {
    rpc.mockResolvedValue(state === "denied"
      ? { data: [{ allowed: false, reset_at: "2026-10-05T02:05:00Z" }], error: null }
      : { data: null, error: { message: "database unavailable" } });
    const { apiFootballGet } = await import("./api_football.server");
    const result = await apiFootballGet("/players/squads?team=1");
    expect(result.status).toBe("UNAVAILABLE");
    expect(result.errorMessage).toContain("Rate limit compartilhado");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("serializes concurrent local calls fifteen seconds apart and caps the shared budget at two", async () => {
    rpc.mockResolvedValue({ data: [{ allowed: true, reset_at: "2026-10-05T02:01:00Z" }], error: null });
    const times: number[] = [];
    fetchMock.mockImplementation(async () => {
      times.push(Date.now());
      return new Response(JSON.stringify({ response: [], errors: [] }), {
        headers: { "x-ratelimit-limit": "10", "x-ratelimit-remaining": "9" },
      });
    });
    const { apiFootballGet, apiFootballRateLimitState } = await import("./api_football.server");
    const calls = Promise.all([apiFootballGet("/teams?country=England"), apiFootballGet("/players/squads?team=2")]);
    await vi.runAllTimersAsync();
    expect((await calls).map((result) => result.status)).toEqual(["OK", "OK"]);
    expect(times[1]! - times[0]!).toBeGreaterThanOrEqual(15000);
    expect(rpc).toHaveBeenCalledWith("acquire_external_api_slot", expect.objectContaining({ p_limit: 2 }));
    expect(apiFootballRateLimitState().distributedLimitPerMinute).toBe(2);
  });

  it("returns cached payloads without acquiring another slot or fetching again", async () => {
    rpc.mockResolvedValue({ data: [{ allowed: true, reset_at: "2026-10-05T02:01:00Z" }], error: null });
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ response: [], errors: [] })));
    const { apiFootballGet } = await import("./api_football.server");
    await apiFootballGet("/players/squads?team=3");
    rpc.mockClear();
    expect((await apiFootballGet("/players/squads?team=3")).fromCache).toBe(true);
    expect(rpc).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
