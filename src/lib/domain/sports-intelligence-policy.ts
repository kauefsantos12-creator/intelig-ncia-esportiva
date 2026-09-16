export const SPORTS_SEASON = "2026/27" as const;

export type BroadcastSourceKind = "OFFICIAL" | "FUTNATV" | "AGGREGATOR" | "MANUAL";

export interface BroadcastCandidate {
  broadcaster: string;
  platform?: string | null;
  sourceKind: BroadcastSourceKind;
  sourceName: string;
  sourceUrl?: string | null;
  checkedAt: string;
  confidence?: number | null;
}

export interface ResolvedBroadcast {
  broadcaster: string;
  platform: string | null;
  sourceKind: BroadcastSourceKind;
  sourceName: string;
  sourceUrl: string | null;
  checkedAt: string;
  confidence: number;
  conflicts: BroadcastCandidate[];
}

const BROADCAST_PRIORITY: Record<BroadcastSourceKind, number> = {
  OFFICIAL: 400,
  FUTNATV: 300,
  AGGREGATOR: 200,
  MANUAL: 100,
};

function normalizeLabel(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

function safeConfidence(value: number | null | undefined, sourceKind: BroadcastSourceKind): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.min(1, Math.max(0, value));
  if (sourceKind === "OFFICIAL") return 1;
  if (sourceKind === "FUTNATV") return 0.9;
  if (sourceKind === "AGGREGATOR") return 0.75;
  return 0.6;
}

export function resolveBroadcastCandidates(candidates: BroadcastCandidate[]): ResolvedBroadcast | null {
  if (candidates.length === 0) return null;

  const sorted = [...candidates].sort((a, b) => {
    const priority = BROADCAST_PRIORITY[b.sourceKind] - BROADCAST_PRIORITY[a.sourceKind];
    if (priority !== 0) return priority;
    const confidence = safeConfidence(b.confidence, b.sourceKind) - safeConfidence(a.confidence, a.sourceKind);
    if (confidence !== 0) return confidence;
    return Date.parse(b.checkedAt) - Date.parse(a.checkedAt);
  });

  const winner = sorted[0];
  if (!winner) return null;
  const winnerBroadcaster = normalizeLabel(winner.broadcaster);
  const winnerPlatform = normalizeLabel(winner.platform);
  const conflicts = sorted.slice(1).filter((candidate) => (
    normalizeLabel(candidate.broadcaster) !== winnerBroadcaster ||
    normalizeLabel(candidate.platform) !== winnerPlatform
  ));

  return {
    broadcaster: winner.broadcaster.trim(),
    platform: winner.platform?.trim() || null,
    sourceKind: winner.sourceKind,
    sourceName: winner.sourceName,
    sourceUrl: winner.sourceUrl ?? null,
    checkedAt: winner.checkedAt,
    confidence: safeConfidence(winner.confidence, winner.sourceKind),
    conflicts,
  };
}

export interface AnnotationEligibilityInput {
  hasBroadcastListing: boolean;
  alwaysTrack: boolean;
}

export function isAnnotationEligible(input: AnnotationEligibilityInput): boolean {
  return input.hasBroadcastListing || input.alwaysTrack;
}

export type ParticipationState = "PARTICIPATED" | "DID_NOT_PLAY" | "UNKNOWN";

export interface PlayerParticipationInput {
  minutes: number | null | undefined;
  inStartingXI?: boolean | null;
  listedAsSubstitute?: boolean | null;
  matchFinished: boolean;
}

export function classifyPlayerParticipation(input: PlayerParticipationInput): ParticipationState {
  if (!input.matchFinished) return "UNKNOWN";
  if (typeof input.minutes === "number" && Number.isFinite(input.minutes)) {
    return input.minutes > 0 ? "PARTICIPATED" : "DID_NOT_PLAY";
  }
  if (input.inStartingXI) return "PARTICIPATED";
  return "UNKNOWN";
}

export interface PersonalPlayerRating {
  playerId: number | string;
  participation: ParticipationState;
  rating: number | null;
}

export interface TeamPersonalRatingResult {
  average: number | null;
  ratedPlayers: number;
  participants: number;
  complete: boolean;
}

export function teamPersonalRating(rows: PersonalPlayerRating[]): TeamPersonalRatingResult {
  const participants = rows.filter((row) => row.participation === "PARTICIPATED");
  const ratings = participants
    .map((row) => row.rating)
    .filter((rating): rating is number => typeof rating === "number" && Number.isFinite(rating));
  const allValid = ratings.length === participants.length && ratings.every((rating) => rating >= 0 && rating <= 10);

  return {
    average: participants.length > 0 && allValid
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : null,
    ratedPlayers: ratings.length,
    participants: participants.length,
    complete: participants.length > 0 && allValid,
  };
}

export function isValidPersonalRating(value: number | null): boolean {
  if (value === null) return true;
  if (!Number.isFinite(value) || value < 0 || value > 10) return false;
  return Math.abs(value * 2 - Math.round(value * 2)) < 1e-9;
}

export interface AutoCloseReviewInput {
  matchFinished: boolean;
  reviewPending: boolean;
  finishedAt: string | null;
  cutoffAt: string;
}

export function shouldAutoCloseUnwatched(input: AutoCloseReviewInput): boolean {
  if (!input.matchFinished || !input.reviewPending || !input.finishedAt) return false;
  const finishedAt = Date.parse(input.finishedAt);
  const cutoffAt = Date.parse(input.cutoffAt);
  if (!Number.isFinite(finishedAt) || !Number.isFinite(cutoffAt)) return false;
  return finishedAt <= cutoffAt;
}

export interface MatchFactPack {
  fixtureId: number | string;
  competition: string;
  kickoffAt: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number | null;
  awayGoals: number | null;
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED" | "UNKNOWN";
  teamStats: Record<string, { home: number | string | null; away: number | string | null }>;
  events: Array<{ minute: number | null; type: string; detail?: string | null; team?: string | null; player?: string | null }>;
  source: string;
  fetchedAt: string;
}
