import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MyGameLineupView } from "@/components/MyGameLineup";
import { PersonalMatchReports } from "@/components/PersonalMatchReports";
import { ProductPageHeader, SurfaceCard } from "@/components/ProductSurface";
import { ErrorState, LoadingState } from "@/components/SurfaceState";
import { getMyGameLineup, getMyGamesForDate } from "@/lib/my-games.functions";
import type { MyGame, MyGameLineup } from "@/lib/my-games";

const localDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const localTime = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});
export function MyGamesPage() {
  const load = useServerFn(getMyGamesForDate);
  const loadLineup = useServerFn(getMyGameLineup);
  const [date, setDate] = useState(localDate);
  const [games, setGames] = useState<MyGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MyGameLineup | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const request = useRef(0);
  useEffect(() => {
    let current = true;
    request.current += 1;
    setLoading(true);
    setError(false);
    setGames([]);
    setSelectedId(null);
    setDetail(null);
    setDetailLoading(false);
    setDetailError(false);
    void load({ data: { date } })
      .then((result) => {
        if (current) setGames(result);
      })
      .catch(() => {
        if (current) setError(true);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [date, refresh, load]);
  const select = useCallback(
    async (fixtureId: string) => {
      const token = ++request.current;
      setSelectedId(fixtureId);
      setDetail(null);
      setDetailLoading(true);
      setDetailError(false);
      try {
        const result = await loadLineup({ data: { fixtureId } });
        if (request.current === token) setDetail(result);
      } catch {
        if (request.current === token) setDetailError(true);
      } finally {
        if (request.current === token) setDetailLoading(false);
      }
    },
    [loadLineup],
  );
  return (
    <AppShell stage="notes">
      <ProductPageHeader
        eyebrow="Seu caderno de futebol"
        title="Meus Jogos"
        description="Escolha uma partida, consulte a escalação e registre sua leitura antes, durante ou depois do jogo."
      />
      <div className="mt-6 space-y-6">
        <SurfaceCard
          icon={CalendarDays}
          title="Partidas para acompanhar"
          description="Horários de Brasília. Você também pode informar uma partida diretamente no seu relato."
        >
          <label className="block max-w-xs type-meta font-medium">
            Data das partidas
            <input
              type="date"
              value={date}
              onChange={(event) => {
                if (event.target.value) setDate(event.target.value);
              }}
              className="mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3"
            />
          </label>
          <div className="mt-4">
            {loading ? (
              <LoadingState label="Carregando partidas" rows={2} />
            ) : error ? (
              <ErrorState
                description="Não foi possível consultar as partidas. Seu editor de relatos continua disponível abaixo."
                onRetry={() => setRefresh((value) => value + 1)}
              />
            ) : games.length ? (
              <ul className="space-y-2">
                {games.map((game) => (
                  <li key={game.id}>
                    <button
                      type="button"
                      aria-pressed={selectedId === game.id}
                      onClick={() => void select(game.id)}
                      className="touch-target w-full rounded-xl border border-border/70 bg-secondary/20 p-4 text-left aria-pressed:border-primary"
                    >
                      <span className="block break-words type-label">
                        {game.homeTeam} × {game.awayTeam}
                      </span>
                      <span className="mt-1 block type-meta text-muted-foreground">
                        {localTime.format(new Date(game.kickoffAt))} · {game.competition} · Ver
                        escalação
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="type-meta text-muted-foreground">
                Não há partidas carregadas para esta data. Você pode começar preenchendo os times no
                seu relato.
              </p>
            )}
          </div>
        </SurfaceCard>
        {detailLoading ? (
          <LoadingState label="Carregando escalação" rows={4} />
        ) : detailError ? (
          <ErrorState
            description="Não foi possível carregar a escalação. Você pode continuar escrevendo seu relato."
            onRetry={() => {
              if (selectedId) void select(selectedId);
            }}
          />
        ) : detail ? (
          <MyGameLineupView detail={detail} />
        ) : null}
        <PersonalMatchReports fixtures={games} onFixtureChosen={(id) => void select(id)} />
        <details className="rounded-xl border border-border/60 p-4">
          <summary className="touch-target min-h-11 cursor-pointer type-meta">
            Registros anteriores
          </summary>
          <a href="/anotacoes" className="inline-flex min-h-11 items-center type-meta underline">
            Abrir anotações e avaliações do histórico anterior
          </a>
        </details>
      </div>
    </AppShell>
  );
}
