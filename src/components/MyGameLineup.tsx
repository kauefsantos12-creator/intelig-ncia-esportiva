import { UsersRound } from "lucide-react";
import { SurfaceCard } from "@/components/ProductSurface";
import type { MyGameLineup, MyGamePlayer } from "@/lib/my-games";

function Players({ players }: { players: MyGamePlayer[] }) {
  return players.length ? (
    <ul className="divide-y divide-border/50">
      {players.map((player) => (
        <li key={player.id} className="flex min-w-0 items-baseline gap-3 py-2 type-meta">
          <span className="w-7 shrink-0 text-right font-mono text-muted-foreground">
            {player.number ?? "—"}
          </span>
          <span className="min-w-0 flex-1 break-words">{player.name}</span>
          <span className="shrink-0 type-caption text-muted-foreground">
            {player.position ?? ""}
          </span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="type-meta text-muted-foreground">Não informados.</p>
  );
}
export function MyGameLineupView({ detail }: { detail: MyGameLineup }) {
  const sources = [
    ...new Set(detail.teams.flatMap((team) => team.players.map((player) => player.source))),
  ];
  return (
    <SurfaceCard
      icon={UsersRound}
      title="Escalação da partida"
      description={`${detail.game.homeTeam} × ${detail.game.awayTeam}`}
    >
      {sources.length ? (
        <p className="mb-4 type-caption text-muted-foreground">
          {sources.join(" · ")}. Reserva relacionado não confirma entrada em campo.
        </p>
      ) : (
        <p className="mb-4 type-meta text-muted-foreground">
          A escalação ainda não está disponível. Você já pode escrever seu relato.
        </p>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        {detail.teams.map((team) => (
          <section key={team.id} aria-label={`Escalação do ${team.name}`}>
            <h3 className="type-label font-semibold">{team.name}</h3>
            <p className="mt-1 type-meta text-muted-foreground">
              {[team.formation, team.coach].filter(Boolean).join(" · ") ||
                "Formação e técnico não informados"}
            </p>
            <h4 className="mb-1 mt-4 type-meta font-semibold">Titulares</h4>
            <Players players={team.players.filter((player) => player.role === "starter")} />
            <details className="mt-4 rounded-xl border border-border/60 p-3">
              <summary className="touch-target min-h-11 cursor-pointer type-meta font-medium">
                Reservas ({team.players.filter((player) => player.role === "bench").length})
              </summary>
              <Players players={team.players.filter((player) => player.role === "bench")} />
            </details>
            {team.players.some((player) => player.role === "unknown") ? (
              <>
                <h4 className="mb-1 mt-4 type-meta font-semibold">Função não informada</h4>
                <Players players={team.players.filter((player) => player.role === "unknown")} />
              </>
            ) : null}
          </section>
        ))}
      </div>
    </SurfaceCard>
  );
}
