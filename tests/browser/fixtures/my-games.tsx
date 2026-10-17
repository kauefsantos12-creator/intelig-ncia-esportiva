// Fixture de teste com transporte simulado; nenhum bypass de auth na aplicação.
import { MyGamesShell } from "@/components/MyGamesShell";
import { MyGamesLayout } from "@/components/MyGamesLayout";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { SurfaceCard } from "@/components/ProductSurface";
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
  const [allowFixture, setAllowFixture] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  return (
    <MyGamesShell onSignOut={() => undefined}>
      <button
        type="button"
        className="touch-target min-h-11 border p-2"
        onClick={() => setAllowFixture(false)}
      >
        Bloquear troca da partida
      </button>
      <MyGamesLayout
        games={
          <SurfaceCard title="Escolha seu jogo">
            <label className="block type-meta">
              Data das partidas
              <input
                aria-label="Data das partidas"
                type="date"
                value="2026-10-16"
                readOnly
                className="block min-h-11 w-full rounded-xl border border-input p-2"
              />
            </label>
            <button
              className="touch-target mt-3 min-h-11 w-full rounded-xl border border-border p-3 text-left"
              type="button"
              aria-pressed="true"
            >
              Clube Casa × Clube Fora
            </button>
            <button
              type="button"
              className="touch-target mt-3 min-h-11 border p-3"
              onClick={() => setUnavailable(true)}
            >
              Simular escalação indisponível
            </button>
          </SurfaceCard>
        }
        lineup={
          unavailable ? (
            <p role="alert">
              Não foi possível carregar a escalação. Você pode continuar escrevendo seu relato.
            </p>
          ) : (
            <MyGameLineupView detail={detail} />
          )
        }
        reports={
          <PersonalMatchReportsView
            fixtures={[game]}
            onFixtureChosen={() => allowFixture}
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
        }
        history={
          <label className="block type-meta">
            Nota no arquivo
            <input className="block min-h-11 rounded-xl border border-input p-2" />
          </label>
        }
        account={
          <div>
            <h2 className="type-section-title">Conta e privacidade</h2>
            <p>Controles simulados apenas neste fixture de navegador.</p>
          </div>
        }
        privacy={<PrivacyNotice embedded />}
      />
    </MyGamesShell>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
