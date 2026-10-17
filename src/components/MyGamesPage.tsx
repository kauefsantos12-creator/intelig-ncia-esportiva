import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MyGamePitch } from "@/components/MyGamePitch";
import { PersonalMatchReports } from "@/components/PersonalMatchReports";
import { SurfaceCard } from "@/components/ProductSurface";
import { ErrorState, LoadingState } from "@/components/SurfaceState";
import { getMyGameLineup, getMyGamesForDate } from "@/lib/my-games.functions";
import type { MyGame, MyGameLineup } from "@/lib/my-games";

import { MyGamesLayout } from "@/components/MyGamesLayout";
import { LegacyNotesPanel } from "@/components/LegacyNotesPanel";
import { AccountPrivacyPanel } from "@/components/AccountPrivacyPanel";
import { PrivacyNotice } from "@/components/PrivacyNotice";

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
  const pitchStatus = useRef({ dirty: false, busy: false });
  const [pitchBusy, setPitchBusy] = useState(false);
  const onPitchDirty = useCallback((dirty: boolean) => {
    pitchStatus.current.dirty = dirty;
  }, []);
  const onPitchBusy = useCallback((busy: boolean) => {
    pitchStatus.current.busy = busy;
    setPitchBusy(busy);
  }, []);
  function allowPitchChange() {
    return (
      !pitchStatus.current.busy &&
      (!pitchStatus.current.dirty ||
        window.confirm(
          "Há notas ainda não salvas. Deseja trocar de partida e descartar essas alterações?",
        ))
    );
  }
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
  const loadSelected = useCallback(
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
  function select(fixtureId: string) {
    if (!allowPitchChange()) return false;
    void loadSelected(fixtureId);
    return true;
  }
  return (
    <AppShell stage="notes">
      <MyGamesLayout
        games={
          <SurfaceCard
            icon={CalendarDays}
            title="Escolha seu jogo"
            className="journal-games-card"
            description="Partidas carregadas para a data. Horários de Brasília."
          >
            <label className="block max-w-xs type-meta font-medium">
              Data das partidas
              <input
                type="date"
                value={date}
                disabled={pitchBusy}
                onChange={(event) => {
                  if (event.target.value && event.target.value !== date && allowPitchChange())
                    setDate(event.target.value);
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
                <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
                  {games.map((game) => (
                    <li key={game.id}>
                      <button
                        type="button"
                        disabled={pitchBusy}
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
                  Não há partidas carregadas para esta data. Você pode começar preenchendo os times
                  no seu relato.
                </p>
              )}
            </div>
          </SurfaceCard>
        }
        lineup={
          detailLoading ? (
            <LoadingState label="Carregando escalação" rows={4} />
          ) : detailError ? (
            <ErrorState
              description="Não foi possível carregar a escalação. Você pode continuar escrevendo seu relato."
              onRetry={() => {
                if (selectedId) void select(selectedId);
              }}
            />
          ) : detail ? (
            <MyGamePitch
              key={detail.game.id}
              detail={detail}
              onDirtyChange={onPitchDirty}
              onBusyChange={onPitchBusy}
            />
          ) : (
            <div className="journal-lineup-empty">
              <img src="/brand/meus-jogos.svg" alt="" width="64" height="64" aria-hidden />
              <h2>A próxima história começa em campo.</h2>
              <p>
                Escolha uma partida para consultar a escalação.
                <br />
                Você também pode escrever seu relato informando os times.
              </p>
            </div>
          )
        }
        reports={<PersonalMatchReports fixtures={games} onFixtureChosen={select} />}
        history={<LegacyNotesPanel />}
        account={<AccountPrivacyPanel />}
        privacy={<PrivacyNotice embedded />}
      />
    </AppShell>
  );
}
