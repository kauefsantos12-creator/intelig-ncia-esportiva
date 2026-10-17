import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { Map as MapIcon, Save } from "lucide-react";
import { SurfaceCard } from "@/components/ProductSurface";
import { buildPitch } from "@/lib/tactical-pitch";
import {
  ratingLabel,
  type PitchRatingInput,
  type PitchRatings,
  type PitchSaveResult,
} from "@/lib/pitch-rating";
import type { MyGameLineup, MyGamePlayer } from "@/lib/my-games";

type Draft = { value: string; confirmed: boolean };
export function MyGamePitchView({
  detail,
  state,
  loading = false,
  loadError = false,
  onReload,
  onSave,
  onDirtyChange,
  onBusyChange,
}: {
  detail: MyGameLineup;
  state: PitchRatings;
  loading?: boolean;
  loadError?: boolean;
  onReload: () => void;
  onSave: (input: PitchRatingInput) => Promise<PitchSaveResult>;
  onDirtyChange?: (dirty: boolean) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const formId = useId();
  const editor = useRef<HTMLDivElement>(null);
  const [teamId, setTeamId] = useState(detail.teams[0]?.id ?? "");
  const [selected, setSelected] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const team = detail.teams.find((t) => t.id === teamId) ?? detail.teams[0];
  const saved = useMemo(
    () => new Map(state.ratings.map((r) => [r.playerId, r] as const)),
    [state.ratings],
  );
  const player = team?.players.find((p) => p.id === selected);
  const current = player ? saved.get(player.id) : undefined;
  const draft = player
    ? (drafts[player.id] ?? {
        value: current?.rating == null ? "" : String(current.rating),
        confirmed: current?.participationState === "PARTICIPATED",
      })
    : { value: "", confirmed: false };
  const pending = Object.entries(drafts).filter(
    ([id, d]) => d.value !== (saved.get(id)?.rating == null ? "" : String(saved.get(id)?.rating)),
  ).length;
  const finalized = state.reviewStatus !== null && state.reviewStatus !== "PENDING";
  const disabled = loading || loadError || finalized || saving;
  const changed = player && draft.value !== (current?.rating == null ? "" : String(current.rating));
  const layout = team ? buildPitch(team) : { lines: [], reason: "Escalação não disponível." };
  useEffect(() => {
    onDirtyChange?.(pending > 0);
    return () => onDirtyChange?.(false);
  }, [pending, onDirtyChange]);
  useEffect(() => {
    onBusyChange?.(saving);
    return () => onBusyChange?.(false);
  }, [saving, onBusyChange]);
  useEffect(() => {
    if (!pending && !saving) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [pending, saving]);
  function selectPlayer(id: string) {
    setSelected(id);
    setMessage(null);
    setError(null);
    requestAnimationFrame(() => editor.current?.focus({ preventScroll: true }));
  }
  function change(patch: Partial<Draft>) {
    if (!player) return;
    setDrafts((previous) => ({ ...previous, [player.id]: { ...draft, ...patch } }));
    setMessage(null);
    setError(null);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!player || disabled || !changed || (draft.value !== "" && !draft.confirmed)) return;
    const id = player.id;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const result = await onSave({
        fixtureId: detail.game.id,
        playerId: id,
        rating: draft.value === "" ? null : Number(draft.value),
        confirmed: draft.confirmed,
        expectedUpdatedAt: current?.updatedAt ?? null,
      });
      if (!result.ok) {
        setError(
          result.error === "CONFLICT"
            ? "Esta nota mudou em outra sessão. Sua alteração continua aqui. Atualize as notas para comparar antes de salvar novamente."
            : result.error === "FINALIZED"
              ? "Esta anotação foi finalizada. Sua alteração continua aqui; atualize para consultar a versão salva."
              : "Não foi possível salvar. Sua nota continua selecionada; tente novamente.",
        );
        return;
      }
      setDrafts((previous) => {
        const next = { ...previous };
        delete next[id];
        return next;
      });
      setMessage(
        result.rating.rating === null
          ? `Nota de ${player.name} removida.`
          : `Nota ${ratingLabel(result.rating.rating)} de ${player.name} salva.`,
      );
    } catch {
      setError(
        "Não foi possível confirmar o salvamento. Sua nota continua selecionada; tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }
  function playerButton(p: MyGamePlayer, pitch: boolean) {
    const score = saved.get(p.id)?.rating ?? null;
    return (
      <button
        type="button"
        key={p.id}
        disabled={saving}
        onClick={() => selectPlayer(p.id)}
        aria-pressed={selected === p.id}
        aria-label={`${p.name}, camisa ${p.number ?? "não informada"}, nota ${score === null ? "não atribuída" : ratingLabel(score)}`}
        className={pitch ? "touch-target pitch-player" : "touch-target pitch-bench-player"}
      >
        <span className="pitch-shirt" aria-hidden>
          {p.number ?? "—"}
        </span>
        <span className="pitch-player-name">{p.name}</span>
        <span className="pitch-score" aria-label="Nota salva">
          {ratingLabel(score)}
        </span>
      </button>
    );
  }
  return (
    <SurfaceCard
      icon={MapIcon}
      title="Campinho da partida"
      description={`${detail.game.homeTeam} × ${detail.game.awayTeam}`}
      className="pitch-card"
    >
      <p className="type-caption text-muted-foreground">
        {[...new Set(detail.teams.flatMap((t) => t.players.map((p) => p.source)))].join(" · ") ||
          "Escalação ainda não informada."}
      </p>
      <p className="mt-2 type-meta text-muted-foreground">
        Toque em um jogador para dar sua nota. Distribuição ilustrativa pela formação informada;
        posições dentro das linhas são aproximadas.
      </p>
      <div className="pitch-team-switch" role="group" aria-label="Equipe no campinho">
        {detail.teams.map((t) => (
          <button
            type="button"
            key={t.id}
            disabled={saving}
            aria-pressed={team?.id === t.id}
            onClick={() => {
              setTeamId(t.id);
              setSelected(null);
              setMessage(null);
              setError(null);
            }}
            className="touch-target"
          >
            {t.name}
          </button>
        ))}
      </div>
      {loading ? (
        <p role="status" className="type-meta">
          Carregando suas notas…
        </p>
      ) : null}
      {loadError ? (
        <div role="alert" className="type-meta text-destructive">
          <p>Não foi possível carregar suas notas. O campinho continua disponível para consulta.</p>
          <button type="button" className="touch-target min-h-11 underline" onClick={onReload}>
            Tentar carregar notas
          </button>
        </div>
      ) : null}
      {finalized ? (
        <p className="type-meta">Anotação finalizada: notas em modo de consulta.</p>
      ) : null}
      {team ? (
        <section aria-label={`Campinho do ${team.name}`}>
          <div className="pitch-team-heading">
            <h3>{team.name}</h3>
            <p>
              {[team.formation, team.coach].filter(Boolean).join(" · ") ||
                "Formação e técnico não informados"}
            </p>
          </div>
          {layout.lines.length ? (
            <div className="tactical-pitch">
              <div className="pitch-markings" aria-hidden>
                <span className="pitch-center" />
                <span className="pitch-area pitch-area-top" />
                <span className="pitch-area pitch-area-bottom" />
              </div>
              <div className="pitch-lineup">
                {layout.lines.map((line, index) => (
                  <div
                    key={index}
                    className="pitch-line"
                    style={{
                      gridTemplateColumns: `repeat(${line.players.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {line.players.map((p) => playerButton(p, true))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="type-meta text-muted-foreground">{layout.reason}</p>
              <div className="pitch-related-list">
                {team.players
                  .filter((p) => p.role === "starter")
                  .map((p) => playerButton(p, false))}
              </div>
            </div>
          )}
          <details className="pitch-bench">
            <summary className="touch-target">
              Reservas ({team.players.filter((p) => p.role === "bench").length})
            </summary>
            <p className="type-caption text-muted-foreground">
              Estar relacionado não confirma entrada em campo. Você pode avaliar quem viu atuar.
            </p>
            <div className="pitch-related-list">
              {team.players.filter((p) => p.role === "bench").map((p) => playerButton(p, false))}
            </div>
          </details>
          {team.players.some((p) => p.role === "unknown") ? (
            <div className="pitch-related-list">
              {team.players.filter((p) => p.role === "unknown").map((p) => playerButton(p, false))}
            </div>
          ) : null}
        </section>
      ) : null}
      <div ref={editor} tabIndex={-1} className="pitch-editor" aria-label="Editor da nota pessoal">
        {player ? (
          <form onSubmit={(event) => void submit(event)} aria-label={`Avaliação de ${player.name}`}>
            <h3>Sua nota para {player.name}</h3>
            <p className="type-caption text-muted-foreground">
              Sua avaliação pessoal de 0 a 10, em passos de 0,5.
            </p>
            <label htmlFor={formId} className="mt-3 block type-meta">
              Nota de {player.name}
            </label>
            <select
              id={formId}
              disabled={disabled}
              value={draft.value}
              onChange={(e) => change({ value: e.target.value })}
              className="pitch-rating-select"
            >
              <option value="">Sem nota</option>
              {Array.from({ length: 21 }, (_, i) => i / 2).map((n) => (
                <option key={n} value={String(n)}>
                  {ratingLabel(n)}
                </option>
              ))}
            </select>
            <label className="pitch-confirm">
              <input
                type="checkbox"
                checked={draft.confirmed}
                disabled={disabled}
                onChange={(e) => change({ confirmed: e.target.checked })}
              />
              <span>Eu vi este jogador atuar nesta partida.</span>
            </label>
            <button
              type="submit"
              disabled={disabled || !changed || (draft.value !== "" && !draft.confirmed)}
              className="touch-target pitch-save"
            >
              <Save className="size-4" aria-hidden />
              {saving ? "Salvando nota…" : draft.value === "" ? "Remover nota" : "Salvar nota"}
            </button>
          </form>
        ) : (
          <p className="type-meta text-muted-foreground">
            Selecione um jogador no campinho ou na lista de reservas para avaliar.
          </p>
        )}
        {message ? (
          <p role="status" className="mt-3 type-meta">
            {message}
          </p>
        ) : null}
        {error ? (
          <div role="alert" className="mt-3 type-meta text-destructive">
            <p>{error}</p>
            <button
              type="button"
              disabled={saving}
              className="touch-target min-h-11 underline"
              onClick={onReload}
            >
              Atualizar notas para comparar
            </button>
          </div>
        ) : null}
        {pending ? (
          <p className="mt-3 type-caption text-muted-foreground">
            {pending} {pending === 1 ? "nota com alteração" : "notas com alterações"} por salvar.
            Trocar de jogador preserva sua seleção.
          </p>
        ) : null}
      </div>
    </SurfaceCard>
  );
}
