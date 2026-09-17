import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  Newspaper,
  RefreshCw,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import { StatusBadge } from "@/components/ProductControls";
import { ProductPageHeader, SurfaceCard } from "@/components/ProductSurface";
import { EmptyState, ErrorState, LoadingState } from "@/components/SurfaceState";
import { getNewsOverview, type EloMovement, type NewsOverview, type NewsResult } from "@/lib/news-overview.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Noticiário · Motor de Inteligência Esportiva" },
      { name: "description", content: "Resenha esportiva diária, resultados recentes e movimentos relevantes de Elo." },
    ],
  }),
  component: NewsPage,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  weekday: "long",
  day: "2-digit",
  month: "long",
});

const compactDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "short",
});

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value: string) {
  const date = new Date(value.length === 10 ? `${value}T12:00:00-03:00` : value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : timeFormatter.format(date);
}

function localDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown" : dateKeyFormatter.format(date);
}

function ResultTeam({ name, logo, goals }: { name: string; logo: string | null; goals: number }) {
  const initial = name.trim().charAt(0).toLocaleUpperCase("pt-BR") || "•";
  return (
    <div className="grid min-w-0 grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2.5">
      {logo ? (
        <img src={logo} alt="" loading="lazy" aria-hidden className="size-7 shrink-0 object-contain" />
      ) : (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-secondary/35 type-caption font-semibold text-muted-foreground" aria-hidden>
          {initial}
        </span>
      )}
      <p className="truncate type-label text-foreground">{name}</p>
      <span className="type-metric min-w-6 text-right text-foreground">{goals}</span>
    </div>
  );
}

function ResultRow({ result }: { result: NewsResult }) {
  return (
    <article className="rounded-xl border border-border/55 bg-secondary/22 px-4 py-3">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 truncate type-caption text-muted-foreground">{result.competition}</p>
        <div className="flex shrink-0 items-center gap-2">
          <span className="type-caption text-muted-foreground">{formatTime(result.kickoffAt)}</span>
          <StatusBadge tone="success">Encerrado</StatusBadge>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <ResultTeam name={result.homeTeam} logo={result.homeTeamLogo} goals={result.homeGoals} />
        <ResultTeam name={result.awayTeam} logo={result.awayTeamLogo} goals={result.awayGoals} />
      </div>
    </article>
  );
}

function EloMovementRow({ movement }: { movement: EloMovement }) {
  const positive = movement.delta >= 0;
  const DeltaIcon = positive ? ArrowUpRight : ArrowDownRight;
  const score = movement.goalsFor === null || movement.goalsAgainst === null
    ? null
    : `${movement.goalsFor}–${movement.goalsAgainst}`;

  return (
    <article className="rounded-xl border border-border/55 bg-secondary/22 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate type-label text-foreground">{movement.team}</p>
          <p className="mt-0.5 truncate type-caption text-muted-foreground">
            {movement.competition} · vs. {movement.opponent}{score ? ` · ${score}` : ""}
          </p>
        </div>
        <span className={`flex shrink-0 items-center gap-1 type-metric ${positive ? "text-success" : "text-destructive"}`}>
          <DeltaIcon className="size-4" aria-hidden />
          {positive ? "+" : ""}{movement.delta.toFixed(1)}
        </span>
      </div>
      <p className="mt-2 type-caption text-muted-foreground">
        {movement.ratingBefore.toFixed(1)} → {movement.ratingAfter.toFixed(1)}
      </p>
    </article>
  );
}

function NewsPage() {
  const loadOverview = useServerFn(getNewsOverview);
  const [overview, setOverview] = useState<NewsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await loadOverview();
      setOverview(next);
    } catch {
      setError("Os dados do Noticiário não puderam ser carregados agora.");
    } finally {
      setLoading(false);
    }
  }, [loadOverview]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updatedAt = overview ? formatTime(overview.observedAt) : null;
  const briefing = overview?.briefing ?? null;
  const footballItems = briefing?.items.filter((item) => item.kind === "FOOTBALL_MATCH" || item.kind === "NEWS_CONTEXT") ?? [];

  const groupedResults = useMemo(() => {
    if (!overview) return [];
    const groups = new Map<string, NewsResult[]>();
    for (const result of overview.recentResults) {
      const key = localDateKey(result.kickoffAt);
      const values = groups.get(key) ?? [];
      values.push(result);
      groups.set(key, values);
    }

    const todayKey = localDateKey(overview.observedAt);
    const todayNoon = new Date(`${todayKey}T12:00:00-03:00`);
    const yesterdayKey = Number.isNaN(todayNoon.getTime())
      ? ""
      : localDateKey(new Date(todayNoon.getTime() - 24 * 60 * 60 * 1000));

    return Array.from(groups.entries()).map(([key, results]) => {
      const firstResult = results[0];
      const label = key === todayKey
        ? "Hoje"
        : key === yesterdayKey
          ? "Ontem"
          : firstResult
            ? compactDateFormatter.format(new Date(firstResult.kickoffAt))
            : key;
      return { key, label, results };
    });
  }, [overview]);

  return (
    <AppShell stage="news">
      <div className="space-y-6">
        <ProductPageHeader
          eyebrow="Noticiário"
          title="O que aconteceu e o que mudou"
          description="Comece pela resenha do período. Resultados e Elo entram como contexto factual, sem competir com a leitura principal."
          aside={
            <div className="flex items-center gap-2">
              {updatedAt ? <StatusBadge tone="neutral">Atualizado {updatedAt}</StatusBadge> : null}
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={loading}
                className="touch-target inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border/70 bg-secondary/30 px-3 type-meta font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
              >
                <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
                <span className="hidden sm:inline">Atualizar</span>
              </button>
            </div>
          }
        />

        {loading && !overview ? <LoadingState rows={5} label="Carregando Noticiário" /> : null}
        {error && !overview ? <ErrorState description={error} onRetry={() => void refresh()} /> : null}

        {overview ? (
          <div className="space-y-4">
            <SurfaceCard
              icon={Newspaper}
              title="Resenha esportiva"
              description={briefing ? `Publicada para ${formatDate(briefing.date)}.` : "Síntese editorial do período quando houver uma publicação pronta."}
              actions={briefing?.footballSummary ? <StatusBadge tone="success">Publicada</StatusBadge> : <StatusBadge tone="neutral">Aguardando publicação</StatusBadge>}
            >
              {briefing?.footballSummary ? (
                <div className="space-y-4">
                  <p className="max-w-[78ch] whitespace-pre-line type-body text-foreground/95">{briefing.footballSummary}</p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border/55 pt-3 type-caption text-muted-foreground">
                    {briefing.factsThrough ? <span>Fatos até {formatTime(briefing.factsThrough)} (Brasília)</span> : null}
                    {briefing.generatedAt ? <span>Gerada às {formatTime(briefing.generatedAt)}</span> : null}
                  </div>

                  {footballItems.length ? (
                    <CollapsiblePanel
                      title="Contextos e destaques da resenha"
                      description="Abra para consultar os itens editoriais que sustentam ou complementam a síntese."
                      meta={`${footballItems.length} ${footballItems.length === 1 ? "item" : "itens"}`}
                      className="bg-secondary/10"
                    >
                      <div className="space-y-2">
                        {footballItems.slice(0, 8).map((item) => (
                          <article key={item.id} className="rounded-xl bg-secondary/25 px-4 py-3">
                            <h3 className="type-label text-foreground">{item.title}</h3>
                            {item.body ? <p className="mt-1.5 whitespace-pre-line type-meta text-muted-foreground">{item.body}</p> : null}
                          </article>
                        ))}
                      </div>
                    </CollapsiblePanel>
                  ) : null}
                </div>
              ) : (
                <EmptyState
                  icon={Newspaper}
                  title="A resenha ainda não foi publicada"
                  description="Enquanto não houver uma síntese editorial pronta, os resultados prioritários recentes e as mudanças de Elo continuam disponíveis nesta página."
                />
              )}
            </SurfaceCard>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
              <SurfaceCard
                icon={Trophy}
                title="Resultados recentes"
                description="Partidas encerradas do escopo prioritário registradas no catálogo esportivo nas últimas 48 horas."
                actions={<StatusBadge tone="neutral">{overview.recentResults.length} jogos</StatusBadge>}
              >
                {groupedResults.length ? (
                  <div className="space-y-5">
                    {groupedResults.map((group) => (
                      <section key={group.key} aria-label={`Resultados de ${group.label}`}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <h3 className="type-label text-foreground">{group.label}</h3>
                          <span className="type-caption text-muted-foreground">{group.results.length} {group.results.length === 1 ? "jogo" : "jogos"}</span>
                        </div>
                        <div className="space-y-2">
                          {group.results.map((result) => <ResultRow key={result.id} result={result} />)}
                        </div>
                      </section>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={CalendarClock}
                    title="Sem resultados prioritários recentes"
                    description="Nenhuma partida encerrada do escopo de acompanhamento prioritário foi registrada nas últimas 48 horas."
                  />
                )}
              </SurfaceCard>

              <SurfaceCard
                icon={TrendingUp}
                title="Movimentos de Elo"
                description="Maiores variações registradas em partidas das últimas 48 horas."
                actions={<StatusBadge tone="neutral">{overview.eloMovements.length} movimentos</StatusBadge>}
                className="self-start"
              >
                {overview.eloMovements.length ? (
                  <div className="space-y-2">
                    {overview.eloMovements.map((movement, index) => (
                      <EloMovementRow key={`${movement.fixtureId ?? movement.kickoffAt}-${movement.team}-${index}`} movement={movement} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={TrendingUp}
                    title="Sem movimentos relevantes"
                    description="Não houve variações de Elo acima do piso de exibição no período disponível."
                  />
                )}
              </SurfaceCard>
            </div>

            {briefing?.otherSportsSummary ? (
              <SurfaceCard
                icon={CalendarClock}
                title="Outros esportes"
                description="Acontecimentos incluídos na resenha publicada."
                tone="subtle"
              >
                <p className="max-w-[78ch] whitespace-pre-line type-body text-foreground/90">{briefing.otherSportsSummary}</p>
              </SurfaceCard>
            ) : null}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
