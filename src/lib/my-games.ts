export type MyGame = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  kickoffAt: string;
};
export type MyGamePlayer = {
  id: string;
  teamId: string;
  name: string;
  number: number | null;
  position: string | null;
  role: "starter" | "bench" | "unknown";
  source: string;
  fetchedAt: string;
};
export type MyGameLineup = {
  game: MyGame;
  teams: Array<{
    id: string;
    name: string;
    formation: string | null;
    coach: string | null;
    players: MyGamePlayer[];
  }>;
};
export function row(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) return row(value[0]);
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}
export function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
export function parseMyGame(value: unknown): MyGame | null {
  const data = row(value);
  const id = text(data["id"]);
  const homeTeam = text(row(data["home"])["name"]);
  const awayTeam = text(row(data["away"])["name"]);
  const kickoffAt = text(data["kickoff_at"]);
  if (!id || !homeTeam || !awayTeam || !kickoffAt || !Number.isFinite(Date.parse(kickoffAt)))
    return null;
  return {
    id,
    homeTeam,
    awayTeam,
    kickoffAt,
    competition: text(row(data["competition"])["name"]) ?? "",
  };
}
export function parseMyGameLineup(fixture: unknown, values: unknown[]): MyGameLineup {
  const data = row(fixture);
  const game = parseMyGame(data);
  if (!game) throw new Error("Partida indisponível.");
  const snapshot = row(row(data["metadata"])["reported_lineup"]);
  const coaches = Array.isArray(snapshot["teams"]) ? snapshot["teams"].map(row) : [];
  const latest = new Map<string, MyGamePlayer & { formation: string | null }>();
  const sorted = [...values].sort((a, b) =>
    String(row(b)["fetched_at"] ?? "").localeCompare(String(row(a)["fetched_at"] ?? "")),
  );
  for (const value of sorted) {
    const item = row(value);
    const id = text(item["player_id"]);
    const teamId = text(item["team_id"]);
    const metadata = row(item["metadata"]);
    const name = text(metadata["display_name"]) ?? text(row(item["player"])["name"]);
    if (!id || !teamId || !name || latest.has(`${teamId}:${id}`)) continue;
    const provider = text(item["provider"]);
    const source =
      provider === "manual" && metadata["publisher"] === "ge"
        ? "Informada por você, a partir de prints do ge"
        : provider === "api_football"
          ? "API-Football"
          : "Fonte registrada na partida";
    latest.set(`${teamId}:${id}`, {
      id,
      teamId,
      name,
      number: typeof item["jersey_number"] === "number" ? item["jersey_number"] : null,
      position: text(metadata["source_position"]) ?? text(item["position"]),
      role:
        item["is_starting"] === true
          ? "starter"
          : item["is_substitute"] === true
            ? "bench"
            : "unknown",
      source,
      fetchedAt: text(item["fetched_at"]) ?? "",
      formation: text(item["formation"]),
    });
  }
  return {
    game,
    teams: (
      [
        ["home_team_id", game.homeTeam],
        ["away_team_id", game.awayTeam],
      ] as const
    ).map(([key, name]) => {
      const id = text(data[key]) ?? "";
      const players = [...latest.values()].filter((player) => player.teamId === id);
      const coaching = coaches.find((team) => team["id"] === id);
      return {
        id,
        name,
        players,
        formation:
          players.find((player) => player.formation)?.formation ?? text(coaching?.["formation"]),
        coach: text(coaching?.["coach"]),
      };
    }),
  };
}
