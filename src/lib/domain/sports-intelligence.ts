export type MatchVenue = "HOME" | "AWAY" | "NEUTRAL";

export interface TeamMatchSnapshot {
  kickoffAt: string;
  goalsFor: number;
  goalsAgainst: number;
  teamEloBefore: number;
  opponentEloBefore: number;
  venue?: MatchVenue;
  expectedScore?: number | null;
  shotsOnTargetFor?: number | null;
  shotsOnTargetAgainst?: number | null;
  dangerousAttacksFor?: number | null;
  dangerousAttacksAgainst?: number | null;
  possessionPct?: number | null;
}

export interface FormSummary {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsPerMatch: number | null;
  goalsAgainstPerMatch: number | null;
  avgOpponentElo: number | null;
  avgShotsOnTargetFor: number | null;
  avgShotsOnTargetAgainst: number | null;
  avgDangerousAttacksFor: number | null;
  avgDangerousAttacksAgainst: number | null;
  avgPossessionPct: number | null;
}

export interface AdjustedMoment {
  matches: number;
  weightedActualScore: number | null;
  weightedExpectedScore: number | null;
  performanceVsExpectation: number | null;
  halfLifeDays: number;
}

export interface StreakSignal {
  key:
    | "UNBEATEN_STREAK"
    | "WIN_STREAK"
    | "SCORING_STREAK"
    | "CLEAN_SHEET_STREAK"
    | "CONCEDED_STREAK";
  matches: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function finiteAverage(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function eloExpectedScore(
  teamElo: number,
  opponentElo: number,
  venue: MatchVenue = "NEUTRAL",
  homeAdvantagePoints = 60,
): number {
  const venueAdjustment = venue === "HOME" ? homeAdvantagePoints : venue === "AWAY" ? -homeAdvantagePoints : 0;
  const adjustedTeamElo = teamElo + venueAdjustment;
  return 1 / (1 + 10 ** ((opponentElo - adjustedTeamElo) / 400));
}

export function actualScore(goalsFor: number, goalsAgainst: number): 0 | 0.5 | 1 {
  if (goalsFor > goalsAgainst) return 1;
  if (goalsFor < goalsAgainst) return 0;
  return 0.5;
}

export function summarizeForm(matches: TeamMatchSnapshot[]): FormSummary {
  const wins = matches.filter((match) => match.goalsFor > match.goalsAgainst).length;
  const draws = matches.filter((match) => match.goalsFor === match.goalsAgainst).length;
  const losses = matches.length - wins - draws;
  const goalsFor = matches.reduce((sum, match) => sum + match.goalsFor, 0);
  const goalsAgainst = matches.reduce((sum, match) => sum + match.goalsAgainst, 0);

  return {
    matches: matches.length,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    goalsPerMatch: matches.length ? goalsFor / matches.length : null,
    goalsAgainstPerMatch: matches.length ? goalsAgainst / matches.length : null,
    avgOpponentElo: finiteAverage(matches.map((match) => match.opponentEloBefore)),
    avgShotsOnTargetFor: finiteAverage(matches.map((match) => match.shotsOnTargetFor)),
    avgShotsOnTargetAgainst: finiteAverage(matches.map((match) => match.shotsOnTargetAgainst)),
    avgDangerousAttacksFor: finiteAverage(matches.map((match) => match.dangerousAttacksFor)),
    avgDangerousAttacksAgainst: finiteAverage(matches.map((match) => match.dangerousAttacksAgainst)),
    avgPossessionPct: finiteAverage(matches.map((match) => match.possessionPct)),
  };
}

/**
 * Measures recent performance against what Elo expected, rather than treating
 * every win/draw/loss as equally informative. Recency uses exponential decay,
 * so the result remains explainable and does not require an arbitrary hard cut.
 */
export function calculateAdjustedMoment(
  matches: TeamMatchSnapshot[],
  now = new Date(),
  halfLifeDays = 21,
): AdjustedMoment {
  if (matches.length === 0) {
    return {
      matches: 0,
      weightedActualScore: null,
      weightedExpectedScore: null,
      performanceVsExpectation: null,
      halfLifeDays,
    };
  }

  const safeHalfLife = Math.max(1, halfLifeDays);
  let weightTotal = 0;
  let actualTotal = 0;
  let expectedTotal = 0;

  for (const match of matches) {
    const timestamp = Date.parse(match.kickoffAt);
    const ageDays = Number.isFinite(timestamp)
      ? Math.max(0, (now.getTime() - timestamp) / 86_400_000)
      : 0;
    const weight = 0.5 ** (ageDays / safeHalfLife);
    const expected = match.expectedScore ?? eloExpectedScore(
      match.teamEloBefore,
      match.opponentEloBefore,
      match.venue ?? "NEUTRAL",
    );
    const actual = actualScore(match.goalsFor, match.goalsAgainst);

    weightTotal += weight;
    actualTotal += actual * weight;
    expectedTotal += clamp(expected, 0, 1) * weight;
  }

  const weightedActualScore = actualTotal / weightTotal;
  const weightedExpectedScore = expectedTotal / weightTotal;
  return {
    matches: matches.length,
    weightedActualScore,
    weightedExpectedScore,
    performanceVsExpectation: weightedActualScore - weightedExpectedScore,
    halfLifeDays: safeHalfLife,
  };
}

export function relativeToCompetition(value: number | null, competitionAverage: number | null) {
  if (
    value === null ||
    competitionAverage === null ||
    !Number.isFinite(value) ||
    !Number.isFinite(competitionAverage) ||
    competitionAverage === 0
  ) {
    return { ratio: null, pctDifference: null };
  }
  const ratio = value / competitionAverage;
  return { ratio, pctDifference: ratio - 1 };
}

function countFromLatest(
  matches: TeamMatchSnapshot[],
  predicate: (match: TeamMatchSnapshot) => boolean,
) {
  const ordered = [...matches].sort((a, b) => Date.parse(b.kickoffAt) - Date.parse(a.kickoffAt));
  let count = 0;
  for (const match of ordered) {
    if (!predicate(match)) break;
    count += 1;
  }
  return count;
}

export function detectStreaks(matches: TeamMatchSnapshot[]): StreakSignal[] {
  const candidates: StreakSignal[] = [
    { key: "UNBEATEN_STREAK", matches: countFromLatest(matches, (match) => match.goalsFor >= match.goalsAgainst) },
    { key: "WIN_STREAK", matches: countFromLatest(matches, (match) => match.goalsFor > match.goalsAgainst) },
    { key: "SCORING_STREAK", matches: countFromLatest(matches, (match) => match.goalsFor > 0) },
    { key: "CLEAN_SHEET_STREAK", matches: countFromLatest(matches, (match) => match.goalsAgainst === 0) },
    { key: "CONCEDED_STREAK", matches: countFromLatest(matches, (match) => match.goalsAgainst > 0) },
  ];

  return candidates.filter((signal) => {
    if (signal.key === "WIN_STREAK") return signal.matches >= 4;
    if (signal.key === "CLEAN_SHEET_STREAK") return signal.matches >= 3;
    return signal.matches >= 5;
  });
}

export function eloMovement(current: number | null, reference: number | null, threshold = 25) {
  if (current === null || reference === null || !Number.isFinite(current) || !Number.isFinite(reference)) {
    return { delta: null, significant: false };
  }
  const delta = current - reference;
  return { delta, significant: Math.abs(delta) >= Math.abs(threshold) };
}
