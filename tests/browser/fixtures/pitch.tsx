// Transport simulated in the fixture only. Production auth is unchanged.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { MyGamePitchView } from "@/components/MyGamePitchView";
import { MyGamesShell } from "@/components/MyGamesShell";
import type { MyGameLineup } from "@/lib/my-games";
import type { PitchRatings } from "@/lib/pitch-rating";
import "@/styles.css";

const detail: MyGameLineup = {
  game: {
    id: "12121212-1212-4212-8212-121212121212",
    homeTeam: "Clube Casa",
    awayTeam: "Clube Fora",
    competition: "Teste",
    kickoffAt: "2026-10-16T23:00:00Z",
  },
  teams: ["Casa", "Fora"].map((name, index) => ({
    id: name,
    name: `Clube ${name}`,
    formation: index ? "3-5-2" : "4-4-2",
    coach: `Técnico ${name}`,
    players: (index
      ? ["GOL", "ZAD", "ZAG", "ZAE", "LAD", "LAE", "VOL", "VOL", "MEC", "ATA", "ATA", "ATA"]
      : ["GOL", "LAD", "ZAD", "ZAE", "LAE", "VOL", "VOL", "MEC", "MEC", "ATA", "ATA", "ATA"]
    ).map((position, n) => ({
      id: `${index + 1}0000000-0000-4000-8000-${String(n + 1).padStart(12, "0")}`,
      teamId: name,
      name: `${n === 11 ? "Reserva" : "Jogador"} ${name} ${n + 1}`,
      number: n + 1,
      position,
      role: n === 11 ? "bench" : "starter",
      source: "Escalação de teste",
      fetchedAt: "2026-10-16T22:00:00Z",
    })),
  })),
};
function Fixture() {
  const [data, setData] = useState<PitchRatings>(
    () =>
      JSON.parse(
        sessionStorage.getItem("test-pitch-ratings") ?? '{"reviewStatus":null,"ratings":[]}',
      ) as PitchRatings,
  );
  const [mode, setMode] = useState("success");
  const [error, setError] = useState(false);
  return (
    <MyGamesShell>
      <h1 className="my-6 type-page-title">Campinho</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        <label>
          Transporte de teste
          <select
            aria-label="Transporte de teste"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="block min-h-11 border border-input p-2"
          >
            <option value="success">Sucesso</option>
            <option value="failure">Falha</option>
            <option value="conflict">Conflito</option>
          </select>
        </label>
        <button
          type="button"
          className="touch-target min-h-11 border p-2"
          onClick={() => setError(true)}
        >
          Simular falha ao carregar notas
        </button>
      </div>
      <MyGamePitchView
        detail={detail}
        state={data}
        loadError={error}
        onReload={() => setError(false)}
        onSave={async (input) => {
          if (mode === "failure") throw new Error("test transport failure");
          if (mode === "conflict") return { ok: false, error: "CONFLICT" };
          const rating = {
            playerId: input.playerId,
            rating: input.rating,
            participationState: "PARTICIPATED" as const,
            updatedAt: new Date().toISOString(),
          };
          const next: PitchRatings = {
            reviewStatus: "PENDING",
            ratings: [...data.ratings.filter((r) => r.playerId !== input.playerId), rating],
          };
          sessionStorage.setItem("test-pitch-ratings", JSON.stringify(next));
          setData(next);
          return { ok: true, rating };
        }}
      />
    </MyGamesShell>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
