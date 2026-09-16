import { describe, expect, it } from "vitest";

import { sportsJobFailureDecision } from "./sports-job-policy";

describe("sports job failure policy", () => {
  it("stops immediately for invalid jobs and payloads", () => {
    expect(sportsJobFailureDecision({ attempts: 1, maxAttempts: 5, code: "INVALID_JOB", message: "unknown" }).action).toBe("DEAD");
    expect(sportsJobFailureDecision({ attempts: 1, maxAttempts: 5, code: "INVALID_PAYLOAD", message: "bad payload" }).action).toBe("DEAD");
  });

  it("never schedules beyond max attempts", () => {
    expect(sportsJobFailureDecision({ attempts: 5, maxAttempts: 5, code: "UPSTREAM_UNAVAILABLE", message: "timeout" })).toEqual({
      action: "DEAD",
      retryAfterSeconds: null,
      reason: "max_attempts_exhausted",
    });
  });

  it("uses a longer retry window when a provider match is not available yet", () => {
    const decision = sportsJobFailureDecision({ attempts: 1, maxAttempts: 5, code: "PROVIDER_NOT_FOUND", message: "not found" });
    expect(decision).toEqual({ action: "RETRY", retryAfterSeconds: 900, reason: "provider_not_found" });
  });

  it("backs off provider rate limits", () => {
    const first = sportsJobFailureDecision({ attempts: 1, maxAttempts: 5, code: "UPSTREAM_UNAVAILABLE", message: "HTTP 429 rate limit" });
    const second = sportsJobFailureDecision({ attempts: 2, maxAttempts: 5, code: "UPSTREAM_UNAVAILABLE", message: "cota da API-Football" });
    const envelope = sportsJobFailureDecision({
      attempts: 1,
      maxAttempts: 5,
      code: "EXECUTION_ERROR",
      message: "Too many requests. You have exceeded the limit of requests per minute of your subscription.",
    });
    expect(first.action).toBe("RETRY");
    expect(first.retryAfterSeconds).toBe(300);
    expect(second.retryAfterSeconds).toBe(600);
    expect(envelope).toEqual({ action: "RETRY", retryAfterSeconds: 300, reason: "provider_rate_limited" });
  });

  it("keeps configuration failures recoverable with slow retries", () => {
    expect(sportsJobFailureDecision({ attempts: 1, maxAttempts: 5, code: "UPSTREAM_UNAVAILABLE", message: "API_FOOTBALL_KEY ausente no servidor." })).toEqual({
      action: "RETRY",
      retryAfterSeconds: 1800,
      reason: "provider_configuration",
    });
  });

  it("uses bounded exponential retry for ordinary transient failures", () => {
    expect(sportsJobFailureDecision({ attempts: 1, maxAttempts: 5, code: "EXECUTION_ERROR", message: "network" }).retryAfterSeconds).toBe(60);
    expect(sportsJobFailureDecision({ attempts: 4, maxAttempts: 5, code: "EXECUTION_ERROR", message: "network" }).retryAfterSeconds).toBe(480);
  });
});
