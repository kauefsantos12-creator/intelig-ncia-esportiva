import { describe, expect, it } from "vitest";
import { parseMyGame, parseMyGameLineup } from "./my-games";

const fixture = {
  id: "match-1",
  kickoff_at: "2026-10-16T23:00:00Z",
  home_team_id: "home",
  away_team_id: "away",
  home: { name: "Casa" },
  away: { name: "Fora" },
  competition: { name: "Copa" },
  metadata: { reported_lineup: { teams: [{ id: "home", coach: "Técnica", formation: "4-4-2" }] } },
};
describe("Meus Jogos: fatos da partida independentes do relato", () => {
  it("accepts PostgREST relations and rejects incomplete fixtures", () => {
    expect(parseMyGame({ ...fixture, home: [{ name: "Casa" }] })?.homeTeam).toBe("Casa");
    expect(parseMyGame({ ...fixture, home: null })).toBeNull();
    expect(parseMyGame({ ...fixture, kickoff_at: "invalid" })).toBeNull();
  });
  it("keeps the latest source per team/player without merging namesakes", () => {
    const values = [
      {
        player_id: "one",
        team_id: "home",
        player: { name: "João" },
        is_starting: true,
        fetched_at: "2026-10-16T19:00:00Z",
      },
      {
        player_id: "one",
        team_id: "home",
        player: { name: "João" },
        is_substitute: true,
        fetched_at: "2026-10-16T20:00:00Z",
      },
      { player_id: "two", team_id: "away", player: { name: "João" }, is_starting: true },
    ];
    const result = parseMyGameLineup(fixture, values);
    expect(result.teams[0]?.players).toHaveLength(1);
    expect(result.teams[0]?.players[0]?.role).toBe("bench");
    expect(result.teams[1]?.players[0]?.id).toBe("two");
  });
  it("preserves screenshot names and positions with explicit source attribution", () => {
    const result = parseMyGameLineup(fixture, [
      {
        player_id: "one",
        team_id: "home",
        player: { name: "Nome anterior" },
        jersey_number: 27,
        is_starting: true,
        provider: "manual",
        metadata: { display_name: "Nome informado", source_position: "VOL", publisher: "ge" },
      },
    ]);
    expect(result.teams[0]?.players[0]).toMatchObject({
      name: "Nome informado",
      number: 27,
      position: "VOL",
      role: "starter",
      source: "Informada por você, a partir de prints do ge",
    });
    expect(result.teams[0]).toMatchObject({ coach: "Técnica", formation: "4-4-2" });
  });
  it("does not invent participation, players or tactical coordinates for missing data", () => {
    expect(parseMyGameLineup(fixture, []).teams[0]?.players).toEqual([]);
    const result = parseMyGameLineup(fixture, [
      { player_id: "one", team_id: "home", player: { name: "Atleta" } },
    ]);
    expect(result.teams[0]?.players[0]).toMatchObject({
      role: "unknown",
      number: null,
      position: null,
    });
    expect(result.teams[0]?.players[0]).not.toHaveProperty("minutes");
  });
});
