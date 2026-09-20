import { useServerFn } from "@tanstack/react-start";
import { ArrowDownRight, ArrowUpRight, History, Minus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { StatusBadge } from "@/components/ProductControls";
import { MetricPreview, SurfaceCard } from "@/components/ProductSurface";
import { EmptyState, ErrorState, LoadingState } from "@/components/SurfaceState";
import { getTeamEloHistory } from "@/lib/elo-explorer.functions";

type EloHistory = Awaited<ReturnType<typeof getTeamEloHistory>>;

type EloHistoryPanelProps = {
  teamId: number | null;
  teamName: string | null;
};

const numberFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const HISTORY_PAGE_SIZE = 12;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatRating(value: number | null) {
  return value === null ? "—" : numberFormatter.format(value);
}

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null || Math.abs(value) < 0.05) {
    return <StatusBadge><Minus className="mr-1 size-3" aria-hidden />0,0</StatusBadge>;
  }

  const positive = value > 0;
  return (
    <StatusBadge tone={positive ? "success" : "warning"}>
      {positive ? <ArrowUpRight className="mr-1 size-3" aria-hidden /> : <ArrowDownRight className="mr-1 size-3" aria-hidden />}
      {positive ? "+" : ""}{numberFormatter.format(value)}
    </StatusBadge>
  );
}

export function EloHistoryPanel({ teamId, teamName }: EloHistoryPanelProps) {
  const loadHistory = useServerFn(getTeamEloHistory);
  const [history, setHistory] = useState<EloHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const newestFirst = useMemo(() => [...(history?.history ?? [])].reverse(), [history]);
  const totalPages = Math.max(1, Math.ceil(newestFirst.length / HISTORY_PAGE_SIZE));
  const pageStart = (page - 1) * HISTORY_PAGE_SIZE;
  const visibleHistory = newestFirst.slice(pageStart, pageStart + HISTORY_PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const refresh = useCallback(async () => {
    if (!teamId) {
      setHistory(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setHistory(await loadHistory({ data: { teamId, days: 60 } }));
      setPage(1);
    } catch {
      setError("O histórico Elo desta equipe não pôde ser carregado agora.");
    } finally {
      setLoading(false);
    }
  }, [loadHistory, teamId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!teamId) {
    return (
      <SurfaceCard icon={History} title="Histórico de 60 dias" description="Selecione um clube no ranking para abrir sua trajetória point-in-time." tone="subtle">
        <EmptyState icon={History} title="Selecione um clube" description="O histórico mostra somente ratings já registrados antes e depois de cada partida processada." />
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard
      icon={History}
      title={teamName ? `Histórico · ${teamName}` : "Histórico de 60 dias"}
      description="Escala local registrada partida a partida. Ela é diferente do Elo global atual, que também incorpora a força da liga."
      actions={(
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="touch-target inline-flex min-h-10 items-center gap-2 rounded-xl border border-border/70 bg-secondary/30 px-3 type-meta font-medium text-foreground hover:bg-secondary/55 disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
          Atualizar
        </button>
      )}
    >
      {loading && !history ? (
        <LoadingState label="Carregando histórico Elo" rows={4} />
      ) : error && !history ? (
        <ErrorState description={error} onRetry={() => void refresh()} />
      ) : history && history.history.length ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricPreview label="Jogos" value={String(history.summary.matches)} detail="Partidas processadas em 60 dias" />
            <MetricPreview label="Rating local" value={formatRating(history.summary.current)} detail="Após a partida mais recente" />
            <MetricPreview label="Variação" value={history.summary.delta === null ? "—" : `${history.summary.delta >= 0 ? "+" : ""}${formatRating(history.summary.delta)}`} detail="Desde a primeira referência do período" />
            <MetricPreview label="Faixa" value={`${formatRating(history.summary.minimum)}–${formatRating(history.summary.maximum)}`} detail="Mínimo e máximo locais" />
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/70">
            <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] gap-3 bg-secondary/35 px-4 py-2.5 type-caption uppercase tracking-[0.06em] text-muted-foreground">
              <span>Data</span><span>Partida</span><span>Δ Elo</span>
            </div>
            <div className="divide-y divide-border/60">
              {visibleHistory.map((row) => (
                <div key={row.fixtureId} className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
                  <span className="type-caption text-muted-foreground">{dateFormatter.format(new Date(row.kickoffAt))}</span>
                  <div className="min-w-0">
                    <p className="truncate type-label text-foreground">{row.venue === "HOME" ? "vs" : "@"} {row.opponentName}</p>
                    <p className="mt-0.5 truncate type-caption text-muted-foreground">
                      {row.goalsFor}–{row.goalsAgainst} · {row.leagueName} · {formatRating(row.ratingBefore)} → {formatRating(row.ratingAfter)}
                    </p>
                  </div>
                  <DeltaBadge value={row.delta} />
                </div>
              ))}
            </div>
          </div>

          {totalPages > 1 ? (
            <nav aria-label="Paginação do histórico Elo" className="flex flex-wrap items-center justify-between gap-3">
              <p className="type-caption text-muted-foreground">
                Partidas {pageStart + 1}–{Math.min(pageStart + HISTORY_PAGE_SIZE, newestFirst.length)} de {newestFirst.length} · página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="touch-target min-h-10 rounded-xl border border-border/70 px-3 type-meta font-medium disabled:opacity-40">Anterior</button>
                <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="touch-target min-h-10 rounded-xl border border-border/70 px-3 type-meta font-medium disabled:opacity-40">Próxima</button>
              </div>
            </nav>
          ) : null}

          {history.summary.continuityBreaks.length || history.summary.duplicateFixtureIds.length ? (
            <p className="type-caption text-warning">
              Atenção: foram detectadas inconsistências de continuidade no histórico point-in-time desta equipe.
            </p>
          ) : null}

          {error ? <p className="type-caption text-warning">A atualização mais recente falhou; exibindo a última leitura disponível.</p> : null}
        </div>
      ) : (
        <EmptyState icon={History} title="Sem histórico recente" description="Não há partidas Elo processadas para esta equipe nos últimos 60 dias." />
      )}
    </SurfaceCard>
  );
}
