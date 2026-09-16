import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, ClipboardCheck, Goal, NotebookPen, RefreshCw, Star, Trash2 } from "lucide-react";
import { type MouseEvent, useCallback, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/ProductControls";
import { MetricPreview, ProductPageHeader, SurfaceCard } from "@/components/ProductSurface";
import { EmptyState, ErrorState, LoadingState } from "@/components/SurfaceState";
import {
  addReviewFieldMark,
  deleteReviewFieldMark,
  finalizeNotesReview,
  getNotesOverview,
  getNotesReviewDetail,
  saveNotesReview,
  savePlayerPersonalRating,
  type NotesOverview,
  type NotesReviewDetail,
} from "@/lib/notes-overview.functions";

export const Route = createFileRoute("/anotacoes")({
  head: () => ({
    meta: [
      { title: "Anotações · Motor de Inteligência Esportiva" },
      { name: "description", content: "Registro pessoal pós-jogo com notas, comentários, participantes e campinho." },
    ],
  }),
  component: NotesPage,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function scoreLabel(home: number | null, away: number | null) {
  return home === null || away === null ? "—" : `${home}–${away}`;
}

function NotesPage() {
  const loadOverview = useServerFn(getNotesOverview);
  const loadDetail = useServerFn(getNotesReviewDetail);
  const saveReview = useServerFn(saveNotesReview);
  const saveRating = useServerFn(savePlayerPersonalRating);
  const addMark = useServerFn(addReviewFieldMark);
  const deleteMark = useServerFn(deleteReviewFieldMark);
  const finalizeReview = useServerFn(finalizeNotesReview);

  const [overview, setOverview] = useState<NotesOverview | null>(null);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [detail, setDetail] = useState<NotesReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [markPlayerId, setMarkPlayerId] = useState<string>("");
  const [markNote, setMarkNote] = useState("");

  const refreshOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await loadOverview();
      setOverview(next);
      setSelectedReviewId((current) => current ?? next.queue.find((item) => item.status === "PENDING")?.reviewId ?? next.queue[0]?.reviewId ?? null);
    } catch {
      setError("Sua fila de anotações não pôde ser carregada agora.");
    } finally {
      setLoading(false);
    }
  }, [loadOverview]);

  const refreshDetail = useCallback(async (reviewId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const next = await loadDetail({ data: { reviewId } });
      setDetail(next);
      setNotesDraft(next.review.notes ?? "");
      setMarkPlayerId((current) => current && next.players.some((player) => player.playerId === current) ? current : "");
    } catch {
      setDetailError("O registro desta partida não pôde ser carregado agora.");
    } finally {
      setDetailLoading(false);
    }
  }, [loadDetail]);

  useEffect(() => {
    void refreshOverview();
  }, [refreshOverview]);

  useEffect(() => {
    if (selectedReviewId) void refreshDetail(selectedReviewId);
    else setDetail(null);
  }, [refreshDetail, selectedReviewId]);

  const pendingCount = overview?.queue.filter((item) => item.status === "PENDING").length ?? 0;
  const completedCount = overview?.queue.filter((item) => item.status === "COMPLETED").length ?? 0;
  const watchedCount = overview?.queue.filter((item) => item.watched === true).length ?? 0;

  const participatingPlayers = useMemo(
    () => detail?.players.filter((player) => player.participationState === "PARTICIPATED") ?? [],
    [detail],
  );

  async function persistReview(watched: boolean | null, notes = notesDraft) {
    if (!detail) return;
    setSaving(true);
    setDetailError(null);
    try {
      await saveReview({ data: { reviewId: detail.review.reviewId, watched, notes: watched === false ? null : notes || null } });
      await Promise.all([refreshDetail(detail.review.reviewId), refreshOverview()]);
    } catch {
      setDetailError("A alteração não pôde ser salva.");
    } finally {
      setSaving(false);
    }
  }

  async function persistPlayerRating(player: NotesReviewDetail["players"][number], rating: number | null, notes: string | null) {
    if (!detail) return;
    setSaving(true);
    setDetailError(null);
    try {
      await saveRating({
        data: {
          reviewId: detail.review.reviewId,
          playerId: player.playerId,
          participationState: player.participationState,
          rating,
          notes,
          providerRatingSnapshot: player.providerRating,
        },
      });
      await refreshDetail(detail.review.reviewId);
    } catch {
      setDetailError("A nota pessoal do jogador não pôde ser salva.");
    } finally {
      setSaving(false);
    }
  }

  async function handleFieldClick(event: MouseEvent<HTMLButtonElement>) {
    if (!detail || detail.review.status !== "PENDING" || detail.review.watched !== true) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100;
    setSaving(true);
    setDetailError(null);
    try {
      await addMark({
        data: {
          reviewId: detail.review.reviewId,
          playerId: markPlayerId || null,
          xPercent,
          yPercent,
          note: markNote || null,
        },
      });
      setMarkNote("");
      await refreshDetail(detail.review.reviewId);
    } catch {
      setDetailError("A marcação do campinho não pôde ser salva.");
    } finally {
      setSaving(false);
    }
  }

  async function removeMark(markId: string) {
    if (!detail) return;
    setSaving(true);
    try {
      await deleteMark({ data: { reviewId: detail.review.reviewId, markId } });
      await refreshDetail(detail.review.reviewId);
    } catch {
      setDetailError("A marcação não pôde ser removida.");
    } finally {
      setSaving(false);
    }
  }

  async function completeReview() {
    if (!detail) return;
    setSaving(true);
    setDetailError(null);
    try {
      if (detail.review.watched === true) {
        await saveReview({ data: { reviewId: detail.review.reviewId, watched: true, notes: notesDraft || null } });
      }
      await finalizeReview({ data: { reviewId: detail.review.reviewId } });
      await Promise.all([refreshDetail(detail.review.reviewId), refreshOverview()]);
    } catch {
      setDetailError("Não foi possível finalizar. Confirme primeiro se você assistiu à partida.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell stage="notes">
      <div className="space-y-6">
        <ProductPageHeader
          eyebrow="Anotações"
          title="Seu caderno de jogo"
          description="Fila pós-jogo pessoal para registrar o que você viu, avaliar participantes e guardar leituras visuais no campinho."
          aside={(
            <button
              type="button"
              onClick={() => void refreshOverview()}
              disabled={loading}
              className="touch-target inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/70 bg-secondary/30 px-4 type-meta font-medium text-foreground hover:bg-secondary/55 disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
              Atualizar fila
            </button>
          )}
        />

        {overview ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricPreview label="Pendentes" value={String(pendingCount)} detail="Partidas esperando sua decisão" />
            <MetricPreview label="Concluídas" value={String(completedCount)} detail="Registros finalizados manualmente" />
            <MetricPreview label="Assistidas" value={String(watchedCount)} detail="Partidas marcadas como assistidas" />
          </div>
        ) : null}

        {loading && !overview ? <LoadingState label="Carregando fila pós-jogo" rows={5} /> : null}
        {error && !overview ? <ErrorState description={error} onRetry={() => void refreshOverview()} /> : null}

        {overview ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.7fr)]">
            <SurfaceCard icon={ClipboardCheck} title="Fila pós-jogo" description="Partidas encerradas elegíveis, sem duplicação por usuário." className="self-start">
              {overview.queue.length ? (
                <div className="space-y-2">
                  {overview.queue.map((item) => {
                    const selected = item.reviewId === selectedReviewId;
                    return (
                      <button
                        key={item.reviewId}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSelectedReviewId(item.reviewId)}
                        className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${selected ? "border-primary/60 bg-primary/10" : "border-border/55 bg-secondary/20 hover:bg-secondary/35"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="type-caption text-muted-foreground">{item.competition}</span>
                          <StatusBadge tone={item.status === "COMPLETED" ? "success" : item.status === "AUTO_CLOSED" ? "warning" : "neutral"}>
                            {item.status === "COMPLETED" ? "Concluída" : item.status === "AUTO_CLOSED" ? "Autoencerrada" : "Pendente"}
                          </StatusBadge>
                        </div>
                        <p className="mt-2 type-label text-foreground">{item.homeTeam} {scoreLabel(item.homeGoals, item.awayGoals)} {item.awayTeam}</p>
                        <p className="mt-1 type-caption text-muted-foreground">{dateFormatter.format(new Date(item.kickoffAt))}</p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={ClipboardCheck}
                  title="Nenhuma partida disponível para anotar"
                  description="Quando houver jogos encerrados elegíveis, eles entrarão automaticamente nesta fila."
                />
              )}
            </SurfaceCard>

            <div className="space-y-5">
              {!selectedReviewId ? (
                <SurfaceCard icon={NotebookPen} title="Registro pessoal" description="Selecione uma partida da fila.">
                  <EmptyState icon={NotebookPen} title="Escolha uma partida" description="O formulário completo aparece aqui quando você seleciona um jogo." />
                </SurfaceCard>
              ) : detailLoading && !detail ? (
                <LoadingState label="Carregando anotação" rows={6} />
              ) : detailError && !detail ? (
                <ErrorState description={detailError} onRetry={() => selectedReviewId && void refreshDetail(selectedReviewId)} />
              ) : detail ? (
                <>
                  <SurfaceCard
                    icon={NotebookPen}
                    title={`${detail.review.homeTeam} ${scoreLabel(detail.review.homeGoals, detail.review.awayGoals)} ${detail.review.awayTeam}`}
                    description={`${detail.review.competition} · ${dateFormatter.format(new Date(detail.review.kickoffAt))}`}
                    actions={<StatusBadge tone={detail.review.status === "COMPLETED" ? "success" : "neutral"}>{detail.review.status === "COMPLETED" ? "Finalizada" : "Em edição"}</StatusBadge>}
                  >
                    {detailError ? <div role="alert" className="mb-4 rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 type-meta text-destructive">{detailError}</div> : null}
                    <div className="space-y-5">
                      <div>
                        <p className="mb-2 type-label text-foreground">Você assistiu à partida?</p>
                        <div className="flex flex-wrap gap-2" role="group" aria-label="Você assistiu à partida?">
                          <button
                            type="button"
                            aria-pressed={detail.review.watched === true}
                            disabled={saving || detail.review.status !== "PENDING"}
                            onClick={() => void persistReview(true)}
                            className={`touch-target rounded-xl border px-4 py-2.5 type-meta font-medium ${detail.review.watched === true ? "border-primary/60 bg-primary/15 text-primary" : "border-border/70 bg-secondary/25 text-foreground"}`}
                          >
                            Sim, assisti
                          </button>
                          <button
                            type="button"
                            aria-pressed={detail.review.watched === false}
                            disabled={saving || detail.review.status !== "PENDING"}
                            onClick={() => void persistReview(false, "")}
                            className={`touch-target rounded-xl border px-4 py-2.5 type-meta font-medium ${detail.review.watched === false ? "border-primary/60 bg-primary/15 text-primary" : "border-border/70 bg-secondary/25 text-foreground"}`}
                          >
                            Não assisti
                          </button>
                        </div>
                      </div>

                      {detail.review.watched === true ? (
                        <div>
                          <label htmlFor="match-notes" className="type-label text-foreground">Comentário e impressão geral</label>
                          <textarea
                            id="match-notes"
                            value={notesDraft}
                            onChange={(event) => setNotesDraft(event.target.value)}
                            disabled={detail.review.status !== "PENDING"}
                            rows={5}
                            maxLength={4000}
                            className="mt-2 w-full rounded-xl border border-border/70 bg-secondary/25 px-3 py-3 type-body text-foreground outline-none focus:border-primary disabled:opacity-60"
                            placeholder="Leitura tática, ritmo, comportamentos, ajustes e o que chamou sua atenção."
                          />
                          <button
                            type="button"
                            onClick={() => void persistReview(true)}
                            disabled={saving || detail.review.status !== "PENDING"}
                            className="mt-2 touch-target rounded-xl bg-primary px-4 py-2.5 type-meta font-semibold text-primary-foreground disabled:opacity-50"
                          >
                            Salvar comentário
                          </button>
                        </div>
                      ) : detail.review.watched === false ? (
                        <p className="type-meta text-muted-foreground">Partidas não assistidas são concluídas sem comentário, notas pessoais ou marcações no campinho.</p>
                      ) : null}
                    </div>
                  </SurfaceCard>

                  {detail.review.watched === true ? (
                    <>
                      <SurfaceCard icon={Star} title="Notas pessoais" description="Somente participantes podem receber nota; escala de 0 a 10 em passos de 0,5.">
                        {participatingPlayers.length ? (
                          <div className="divide-y divide-border/55 rounded-xl border border-border/55">
                            {participatingPlayers.map((player) => (
                              <div key={player.playerId} className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_8rem_8rem] sm:items-center">
                                <div className="min-w-0">
                                  <p className="truncate type-label text-foreground">{player.name}</p>
                                  <p className="type-caption text-muted-foreground">{player.teamName} · {player.minutes ?? "—"} min · provedor {player.providerRating ?? "—"}</p>
                                </div>
                                <select
                                  aria-label={`Nota pessoal de ${player.name}`}
                                  value={player.personalRating ?? ""}
                                  disabled={saving || detail.review.status !== "PENDING"}
                                  onChange={(event) => void persistPlayerRating(player, event.target.value === "" ? null : Number(event.target.value), player.personalNotes)}
                                  className="min-h-11 rounded-xl border border-border/70 bg-secondary/25 px-3 type-meta text-foreground"
                                >
                                  <option value="">Sem nota</option>
                                  {Array.from({ length: 21 }, (_, index) => index * 0.5).map((value) => <option key={value} value={value}>{value.toFixed(1)}</option>)}
                                </select>
                                <input
                                  aria-label={`Observação de ${player.name}`}
                                  defaultValue={player.personalNotes ?? ""}
                                  disabled={saving || detail.review.status !== "PENDING"}
                                  onBlur={(event) => void persistPlayerRating(player, player.personalRating, event.target.value || null)}
                                  placeholder="Observação"
                                  className="min-h-11 rounded-xl border border-border/70 bg-secondary/25 px-3 type-meta text-foreground"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <EmptyState icon={Star} title="Participantes ainda não disponíveis" description="As notas aparecem quando a coleta pós-jogo registrar quem participou da partida." />
                        )}
                      </SurfaceCard>

                      <SurfaceCard icon={Goal} title="Campinho" description="Escolha um jogador opcionalmente e clique no campo para guardar uma observação espacial.">
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
                          <div>
                            <button
                              type="button"
                              aria-label="Adicionar marcação no campinho"
                              disabled={saving || detail.review.status !== "PENDING"}
                              onClick={(event) => void handleFieldClick(event)}
                              className="relative aspect-[1.55/1] w-full overflow-hidden rounded-2xl border-2 border-primary/35 bg-primary/10 disabled:opacity-60"
                            >
                              <span className="absolute inset-y-0 left-1/2 w-px bg-primary/35" aria-hidden />
                              <span className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/35" aria-hidden />
                              <span className="absolute inset-y-[23%] left-0 w-[16%] border-y border-r border-primary/35" aria-hidden />
                              <span className="absolute inset-y-[23%] right-0 w-[16%] border-y border-l border-primary/35" aria-hidden />
                              {detail.fieldMarks.map((mark, index) => (
                                <span
                                  key={mark.id}
                                  title={mark.playerName ?? mark.note ?? `Marcação ${index + 1}`}
                                  className="absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-background bg-primary type-caption font-bold text-primary-foreground shadow"
                                  style={{ left: `${mark.xPercent}%`, top: `${mark.yPercent}%` }}
                                >
                                  {index + 1}
                                </span>
                              ))}
                            </button>
                            <p className="mt-2 type-caption text-muted-foreground">Clique em qualquer zona para registrar a posição. As coordenadas são pessoais e não alteram dados oficiais da partida.</p>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label htmlFor="field-player" className="type-meta font-medium text-foreground">Jogador</label>
                              <select
                                id="field-player"
                                value={markPlayerId}
                                onChange={(event) => setMarkPlayerId(event.target.value)}
                                disabled={detail.review.status !== "PENDING"}
                                className="mt-1 min-h-11 w-full rounded-xl border border-border/70 bg-secondary/25 px-3 type-meta text-foreground"
                              >
                                <option value="">Sem jogador</option>
                                {participatingPlayers.map((player) => <option key={player.playerId} value={player.playerId}>{player.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label htmlFor="field-note" className="type-meta font-medium text-foreground">Nota da marcação</label>
                              <input
                                id="field-note"
                                value={markNote}
                                onChange={(event) => setMarkNote(event.target.value)}
                                maxLength={500}
                                disabled={detail.review.status !== "PENDING"}
                                placeholder="Ex.: pressão alta"
                                className="mt-1 min-h-11 w-full rounded-xl border border-border/70 bg-secondary/25 px-3 type-meta text-foreground"
                              />
                            </div>

                            {detail.fieldMarks.length ? (
                              <div className="space-y-2 border-t border-border/55 pt-3">
                                {detail.fieldMarks.map((mark, index) => (
                                  <div key={mark.id} className="flex items-start justify-between gap-2 rounded-lg bg-secondary/25 px-3 py-2">
                                    <div className="min-w-0">
                                      <p className="type-meta text-foreground">{index + 1}. {mark.playerName ?? "Marcação livre"}</p>
                                      {mark.note ? <p className="truncate type-caption text-muted-foreground">{mark.note}</p> : null}
                                    </div>
                                    {detail.review.status === "PENDING" ? (
                                      <button type="button" onClick={() => void removeMark(mark.id)} className="touch-target flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-destructive" aria-label={`Remover marcação ${index + 1}`}>
                                        <Trash2 className="size-4" aria-hidden />
                                      </button>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </SurfaceCard>
                    </>
                  ) : null}

                  {detail.review.status === "PENDING" ? (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => void completeReview()}
                        disabled={saving || detail.review.watched === null}
                        className="touch-target inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 type-meta font-semibold text-primary-foreground disabled:opacity-50"
                      >
                        <CheckCircle2 className="size-4" aria-hidden />
                        Finalizar anotação
                      </button>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
