import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CalendarDays, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { FilterBar, FilterChip, SearchField, StatusBadge } from "@/components/ProductControls";
import { MetricPreview, ProductPageHeader, SurfaceCard } from "@/components/ProductSurface";
import { EmptyState, ErrorState, LoadingState } from "@/components/SurfaceState";
import { TodayFixtureRow } from "@/components/TodayFixtureRow";
import { getBroadcastSyncStatus, type BroadcastSyncStatus } from "@/lib/broadcast-status.functions";
import { getTodayOverview, type TodayOverview } from "@/lib/today-overview.functions";

export const Route = createFileRoute("/hoje")({
  head: () => ({
    meta: [
      { title: "Hoje · Motor de Inteligência Esportiva" },
      { name: "description", content: "Agenda do dia, transmissões confirmadas, forma recente e Elo das equipes acompanhadas." },
    ],
  }),
  component: TodayPage,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  weekday: "long",
  day: "2-digit",
  month: "long",
});

const updateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});

function formatLocalDate(value: string) {
  const date = new Date(`${value}T12:00:00-03:00`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function formatUpdateTime(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : updateTimeFormatter.format(date);
}

function isUpcomingStatus(status: string) {
  return !["LIVE", "FINISHED", "POSTPONED", "CANCELLED"].includes(status);
}

type AgendaFilter = "ALL" | "UPCOMING" | "BROADCAST" | "LIVE" | "FINISHED";

function BroadcastSourceNotice({ status }: { status: BroadcastSyncStatus | null }) {
  if (!status || status.state === "READY") return null;

  if (status.state === "NEVER") {
    return (
      <div className="rounded-2xl border border-border/70 bg-secondary/25 px-4 py-3 type-caption text-muted-foreground">
        A fonte de transmissões ainda não concluiu a primeira sincronização. Jogos sem canal exibido não devem ser interpretados como “sem transmissão”.
      </div>
    );
  }

  return (
    <div className="flex gap-3 rounded-2xl border border-warning/30 bg-warning/5 px-4 py-3">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      <div>
        <p className="type-label text-foreground">Fonte de transmissões temporariamente indisponível</p>
        <p className="mt-1 type-caption text-muted-foreground">
          O último sync do {status.sourceName} falhou. Enquanto isso, “transmissão ainda não confirmada” significa apenas ausência de evidência atualizada.
        </p>
      </div>
    </div>
  );
}

function TodayPage() {
  const loadOverview = useServerFn(getTodayOverview);
  const loadBroadcastStatus = useServerFn(getBroadcastSyncStatus);
  const [overview, setOverview] = useState<TodayOverview | null>(null);
  const [broadcastStatus, setBroadcastStatus] = useState<BroadcastSyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AgendaFilter>("ALL");
  const [search, setSearch] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextOverview, nextBroadcastStatus] = await Promise.all([
        loadOverview(),
        loadBroadcastStatus(),
      ]);
      setOverview(nextOverview);
      setBroadcastStatus(nextBroadcastStatus);
    } catch {
      setError("A agenda de hoje não pôde ser carregada agora.");
    } finally {
      setLoading(false);
    }
  }, [loadBroadcastStatus, loadOverview]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const counts = useMemo(() => {
    const fixtures = overview?.fixtures ?? [];
    return {
      all: fixtures.length,
      upcoming: fixtures.filter((fixture) => isUpcomingStatus(fixture.status)).length,
      live: fixtures.filter((fixture) => fixture.status === "LIVE").length,
      finished: fixtures.filter((fixture) => fixture.status === "FINISHED").length,
      broadcast: fixtures.filter((fixture) => fixture.broadcasts.length > 0).length,
    };
  }, [overview]);

  const filteredFixtures = useMemo(() => {
    if (!overview) return [];
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return overview.fixtures.filter((fixture) => {
      if (filter === "UPCOMING" && !isUpcomingStatus(fixture.status)) return false;
      if (filter === "BROADCAST" && !fixture.broadcasts.length) return false;
      if (filter === "LIVE" && fixture.status !== "LIVE") return false;
      if (filter === "FINISHED" && fixture.status !== "FINISHED") return false;
      if (!term) return true;
      return [fixture.home.name, fixture.away.name, fixture.competition.name]
        .some((value) => value.toLocaleLowerCase("pt-BR").includes(term));
    });
  }, [filter, overview, search]);

  const updatedAt = overview ? formatUpdateTime(overview.observedAt) : null;
  const broadcastUpdatedAt = formatUpdateTime(broadcastStatus?.lastSuccessAt ?? null);

  return (
    <AppShell stage="today">
      <div className="space-y-6">
        <ProductPageHeader
          eyebrow="Hoje"
          title="Os jogos do dia, sem ruído"
          description="Veja primeiro o que importa: horário, confronto, status e transmissão. Abra a partida para consultar forma recente e Elo."
          meta={overview ? <StatusBadge tone="info">{formatLocalDate(overview.localDate)}</StatusBadge> : undefined}
          aside={(
            <div className="flex flex-wrap items-center justify-end gap-2">
              {updatedAt ? <span className="type-caption text-muted-foreground">Atualizado às {updatedAt}</span> : null}
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={loading}
                className="touch-target inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/70 bg-secondary/30 px-4 type-meta font-medium text-foreground hover:bg-secondary/55 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
                Atualizar
              </button>
            </div>
          )}
        />

        {loading && !overview ? (
          <LoadingState label="Carregando a agenda de hoje" rows={5} />
        ) : error && !overview ? (
          <ErrorState title="Não foi possível carregar a agenda" description={error} onRetry={() => void refresh()} />
        ) : overview ? (
          <>
            <SurfaceCard
              icon={CalendarDays}
              title="Agenda do dia"
              description="Partidas em ordem de horário. Expanda somente o confronto que quiser analisar."
              actions={broadcastStatus?.state === "READY"
                ? <StatusBadge tone="success">Transmissões · {broadcastUpdatedAt ? `sync ${broadcastUpdatedAt}` : "sincronizadas"}</StatusBadge>
                : error ? <StatusBadge tone="warning">Atualização parcial</StatusBadge> : undefined}
            >
              <div className="space-y-4">
                <BroadcastSourceNotice status={broadcastStatus} />

                <FilterBar
                  label="Filtrar agenda"
                  trailing={(
                    <SearchField
                      label="Buscar time ou competição"
                      placeholder="Buscar time ou competição"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="w-full sm:w-72"
                    />
                  )}
                >
                  <FilterChip active={filter === "ALL"} onClick={() => setFilter("ALL")}>Todos · {counts.all}</FilterChip>
                  <FilterChip active={filter === "UPCOMING"} onClick={() => setFilter("UPCOMING")}>Próximos · {counts.upcoming}</FilterChip>
                  <FilterChip active={filter === "LIVE"} onClick={() => setFilter("LIVE")}>Ao vivo · {counts.live}</FilterChip>
                  <FilterChip active={filter === "BROADCAST"} onClick={() => setFilter("BROADCAST")}>Com transmissão · {counts.broadcast}</FilterChip>
                  <FilterChip active={filter === "FINISHED"} onClick={() => setFilter("FINISHED")}>Encerrados · {counts.finished}</FilterChip>
                </FilterBar>

                {!overview.fixtures.length ? (
                  <EmptyState
                    icon={CalendarDays}
                    title="Nenhum jogo acompanhado hoje"
                    description="Não há partidas no escopo prioritário registradas para a data atual."
                  />
                ) : filteredFixtures.length ? (
                  <div className="space-y-2">
                    {filteredFixtures.map((fixture) => <TodayFixtureRow key={fixture.id} fixture={fixture} />)}
                  </div>
                ) : (
                  <EmptyState
                    icon={search ? Search : CalendarDays}
                    title="Nenhum jogo corresponde a este filtro"
                    description="Altere o filtro ou a busca para voltar a ver os confrontos acompanhados hoje."
                  />
                )}
              </div>
            </SurfaceCard>

            <SurfaceCard
              title="Cobertura do dia"
              description="Indicadores de completude da agenda. Eles ficam depois dos jogos para não competir com a tarefa principal."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricPreview label="Jogos acompanhados" value={String(overview.coverage.trackedFixtures)} detail="Escopo prioritário do dia" />
                <MetricPreview label="Ao vivo" value={String(counts.live)} detail="Status atual no catálogo" />
                <MetricPreview label="Transmissão" value={String(overview.coverage.confirmedBroadcastFixtures)} detail={broadcastStatus?.state === "READY" ? "Jogos com evidência confirmada" : "Fonte ainda sem sync válido"} />
                <MetricPreview label="Cobertura Elo" value={`${overview.coverage.eloCoveredTeams}/${overview.coverage.totalTeams}`} detail="Equipes com rating atual" />
              </div>
            </SurfaceCard>
          </>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="Nenhum jogo acompanhado hoje"
            description="Não há partidas no escopo prioritário registradas para a data atual."
          />
        )}
      </div>
    </AppShell>
  );
}
