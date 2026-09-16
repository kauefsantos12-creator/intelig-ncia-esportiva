export const SPORTS_PROVIDER_KEYS = ["five_dollar", "api_football", "futnatv", "official", "manual"] as const;
export type SportsProviderKey = (typeof SPORTS_PROVIDER_KEYS)[number];

export type CanonicalFixtureStatus =
  | "SCHEDULED"
  | "LIVE"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED"
  | "UNKNOWN";

export type SportsDataClass =
  | "FIXTURE"
  | "TEAM_STATS"
  | "LINEUP"
  | "PLAYER_STATS"
  | "STANDINGS"
  | "BROADCAST"
  | "ELO"
  | "NEWS_CONTEXT";

export interface SourceProvenance {
  provider: SportsProviderKey | string;
  externalId?: string | number | null;
  sourceUrl?: string | null;
  fetchedAt: string;
  observedAt?: string | null;
  rawHash?: string | null;
}

export interface CanonicalFixtureIdentity {
  primaryProvider: SportsProviderKey | string;
  primaryFixtureId: string | number;
  kickoffAt: string;
  homeTeamId: string | number;
  awayTeamId: string | number;
}

export function fixtureIdentityKey(identity: CanonicalFixtureIdentity): string {
  const provider = String(identity.primaryProvider).trim().toLowerCase();
  const fixture = String(identity.primaryFixtureId).trim();
  if (!provider || !fixture) throw new Error("Fixture identity requires provider and external fixture id.");
  return `${provider}:${fixture}`;
}

export function sportsJobIdempotencyKey(jobType: string, fixtureKey: string, version = "v1"): string {
  const type = jobType.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  const fixture = fixtureKey.trim().toLowerCase();
  const normalizedVersion = version.trim().toLowerCase();
  if (!type || !fixture || !normalizedVersion) throw new Error("Invalid sports job idempotency input.");
  return `${type}:${fixture}:${normalizedVersion}`;
}

export interface FreshnessPolicy {
  maxAgeMs: number;
  staleWhileRevalidateMs: number;
}

export const DEFAULT_FRESHNESS_POLICIES: Record<SportsDataClass, FreshnessPolicy> = {
  FIXTURE: { maxAgeMs: 5 * 60_000, staleWhileRevalidateMs: 30 * 60_000 },
  TEAM_STATS: { maxAgeMs: 15 * 60_000, staleWhileRevalidateMs: 6 * 60 * 60_000 },
  LINEUP: { maxAgeMs: 5 * 60_000, staleWhileRevalidateMs: 60 * 60_000 },
  PLAYER_STATS: { maxAgeMs: 15 * 60_000, staleWhileRevalidateMs: 6 * 60 * 60_000 },
  STANDINGS: { maxAgeMs: 60 * 60_000, staleWhileRevalidateMs: 24 * 60 * 60_000 },
  BROADCAST: { maxAgeMs: 30 * 60_000, staleWhileRevalidateMs: 4 * 60 * 60_000 },
  ELO: { maxAgeMs: 24 * 60 * 60_000, staleWhileRevalidateMs: 48 * 60 * 60_000 },
  NEWS_CONTEXT: { maxAgeMs: 60 * 60_000, staleWhileRevalidateMs: 6 * 60 * 60_000 },
};

export type FreshnessState = "FRESH" | "STALE_REVALIDATE" | "EXPIRED" | "INVALID";

export function freshnessState(
  fetchedAt: string,
  dataClass: SportsDataClass,
  now = new Date(),
): FreshnessState {
  const timestamp = Date.parse(fetchedAt);
  if (!Number.isFinite(timestamp)) return "INVALID";
  const age = Math.max(0, now.getTime() - timestamp);
  const policy = DEFAULT_FRESHNESS_POLICIES[dataClass];
  if (age <= policy.maxAgeMs) return "FRESH";
  if (age <= policy.maxAgeMs + policy.staleWhileRevalidateMs) return "STALE_REVALIDATE";
  return "EXPIRED";
}

export function normalizeFixtureStatus(raw: string | null | undefined): CanonicalFixtureStatus {
  const value = (raw ?? "").trim().toLowerCase();
  if (["finished", "ft", "aet", "pen", "ended", "complete", "completed"].includes(value)) return "FINISHED";
  if (["live", "1h", "2h", "ht", "et", "inplay", "in_play", "inprogress", "in_progress"].includes(value)) return "LIVE";
  if (["scheduled", "notstarted", "not_started", "ns", "timed", "tbd"].includes(value)) return "SCHEDULED";
  if (["postponed", "pst", "suspended", "int"].includes(value)) return "POSTPONED";
  if (["cancelled", "canceled", "canc", "abd", "awarded", "awd", "wo"].includes(value)) return "CANCELLED";
  return "UNKNOWN";
}
