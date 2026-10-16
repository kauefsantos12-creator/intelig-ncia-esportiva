// Fixture de teste com transporte simulado; nenhum bypass de auth na aplicação.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { MyGameLineupView } from "@/components/MyGameLineup";
import { PersonalMatchReportsView } from "@/components/PersonalMatchReportsView";
import type { MyGame, MyGameLineup } from "@/lib/my-games";
import type { PersonalMatchReport } from "@/lib/personal-match-report";
import "@/styles.css";

const game: MyGame = {
  id: "fixture-test",
  homeTeam: "Clube Casa",
  awayTeam: "Clube Fora",
  competition: "Copa de teste",
  kickoffAt: "2026-10-16T23:00:00Z",
};
const detail: MyGameLineup = {
  game,
  teams: ["Casa", "Fora"].map((name, index) => ({
    id: name,
    name: `Clube ${name}`,
    formation: index ? "3-5-2" : "4-4-2",
    coach: `Treinador ${name}`,
    players: [true, false].map((starting, number) => ({
      id: `${name}-${number}`,
      teamId: name,
      name: `${starting ? "Titular" : "Reserva"} ${name}`,
      number: number + 1,
      position: "MEC",
      role: starting ? "starter" : "bench",
      source: "Informada por você, a partir de prints do ge",
      fetchedAt: "2026-10-16T22:00:00Z",
    })),
  })),
};
function Fixture() {
  const [reports, setReports] = useState<PersonalMatchReport[]>(
    () => JSON.parse(sessionStorage.getItem("test-my-games") ?? "[]") as PersonalMatchReport[],
  );
  const [unavailable, setUnavailable] = useState(false);
  return (
    <main className="space-y-5 p-3 sm:p-6">
      <h1 className="type-page-title">Meus Jogos</h1>
      <button type="button" className="min-h-11 border p-3" onClick={() => setUnavailable(true)}>
        Simular escalação indisponível
      </button>
      {unavailable ? (
        <p role="alert">
          Não foi possível carregar a escalação. Você pode continuar escrevendo seu relato.
        </p>
      ) : (
        <MyGameLineupView detail={detail} />
      )}
      <PersonalMatchReportsView
        fixtures={[game]}
        reports={reports}
        onSave={async (input) => {
          const report = {
            ...input,
            version: input.version + 1,
            updatedAt: new Date().toISOString(),
          };
          const next = [report, ...reports.filter((item) => item.id !== report.id)];
          sessionStorage.setItem("test-my-games", JSON.stringify(next));
          setReports(next);
          return { ok: true, report };
        }}
      />
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
