export type AnalyticsMembership = {
  competitionId: string;
  teamId: string;
};

type Row = Record<string, unknown>;

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function buildAnalyticsMemberships(
  fixtureRows: Row[],
  standingRows: Row[],
): AnalyticsMembership[] {
  const memberships = new Map<string, AnalyticsMembership>();

  const add = (competitionId: string | null, teamId: string | null) => {
    if (!competitionId || !teamId) return;
    const key = `${competitionId}:${teamId}`;
    if (!memberships.has(key)) memberships.set(key, { competitionId, teamId });
  };

  for (const row of fixtureRows) {
    const competitionId = text(row["competition_id"]);
    add(competitionId, text(row["home_team_id"]));
    add(competitionId, text(row["away_team_id"]));
  }

  for (const row of standingRows) {
    add(text(row["competition_id"]), text(row["team_id"]));
  }

  return [...memberships.values()].sort(
    (a, b) => a.competitionId.localeCompare(b.competitionId) || a.teamId.localeCompare(b.teamId),
  );
}
