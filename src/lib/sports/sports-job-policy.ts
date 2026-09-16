export type SportsJobFailureCode =
  | "PROVIDER_NOT_FOUND"
  | "UPSTREAM_UNAVAILABLE"
  | "INVALID_JOB"
  | "INVALID_PAYLOAD"
  | "EXECUTION_ERROR";

export class SportsJobExecutionError extends Error {
  constructor(
    public readonly code: SportsJobFailureCode,
    message: string,
  ) {
    super(message);
    this.name = "SportsJobExecutionError";
  }
}

export type SportsJobFailureDecision =
  | { action: "RETRY"; retryAfterSeconds: number; reason: string }
  | { action: "DEAD"; retryAfterSeconds: null; reason: string };

function boundedBackoff(baseSeconds: number, attempt: number, capSeconds: number) {
  const exponent = Math.max(0, Math.min(attempt - 1, 6));
  return Math.min(capSeconds, baseSeconds * 2 ** exponent);
}

export function sportsJobFailureDecision(input: {
  attempts: number;
  maxAttempts: number;
  code?: SportsJobFailureCode;
  message?: string;
}): SportsJobFailureDecision {
  const attempts = Math.max(0, input.attempts);
  const maxAttempts = Math.max(1, input.maxAttempts);
  const message = (input.message ?? "Falha desconhecida").trim();
  const normalized = message.toLowerCase();

  if (attempts >= maxAttempts) {
    return { action: "DEAD", retryAfterSeconds: null, reason: "max_attempts_exhausted" };
  }

  if (
    input.code === "INVALID_PAYLOAD"
    && (
      normalized.includes("fixture canônica não encontrada")
      || normalized.includes("fixture ainda não possui vínculo")
    )
  ) {
    return { action: "DEAD", retryAfterSeconds: null, reason: "invalid_canonical_reference" };
  }

  if (input.code === "INVALID_JOB" || input.code === "INVALID_PAYLOAD") {
    return { action: "DEAD", retryAfterSeconds: null, reason: input.code.toLowerCase() };
  }

  if (input.code === "PROVIDER_NOT_FOUND") {
    return {
      action: "RETRY",
      retryAfterSeconds: boundedBackoff(15 * 60, attempts, 2 * 60 * 60),
      reason: "provider_not_found",
    };
  }

  if (
    normalized.includes("rate limit")
    || normalized.includes("http 429")
    || normalized.includes("cota da api-football")
    || normalized.includes("too many requests")
    || normalized.includes("requests per minute")
  ) {
    return {
      action: "RETRY",
      retryAfterSeconds: boundedBackoff(5 * 60, attempts, 60 * 60),
      reason: "provider_rate_limited",
    };
  }

  if (
    normalized.includes("api_football_key ausente")
    || normalized.includes("api-football não configurada")
    || normalized.includes("credencial rejeitada")
  ) {
    return {
      action: "RETRY",
      retryAfterSeconds: boundedBackoff(30 * 60, attempts, 4 * 60 * 60),
      reason: "provider_configuration",
    };
  }

  return {
    action: "RETRY",
    retryAfterSeconds: boundedBackoff(60, attempts, 15 * 60),
    reason: input.code === "UPSTREAM_UNAVAILABLE" ? "upstream_unavailable" : "transient_execution_error",
  };
}
