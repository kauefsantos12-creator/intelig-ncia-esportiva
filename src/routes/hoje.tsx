import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { FilterBar, FilterChip, SearchField, StatusBadge } from "@/components/ProductControls";
import { MetricPreview, ProductPageHeader, SurfaceCard } from "@/components/ProductSurface";
import { EmptyState, ErrorState, LoadingState } from "@/components/SurfaceState";
import { TodayFixtureRow } from "@/components/TodayFixtureRow";
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

function formatLocalDate(value: string) {
  const date = new Date(`${value}T12:00:00-03:00`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

type AgendaFilter = "ALL" | "BROADCAST" | "LIVE";

function TodayPage() {
  const loadOverview = useServerFn(getTodayOverview);
  const [overview, setOverview] = useState<TodayOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AgendaFilter>("ALL");
  const [search, setSearch] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOverview(await loadOverview());
    } catch {
      setError("A agenda de hoje não pôde ser carregada agora.");
    } finally {
      setLoading(false);
    }
  }, [loadOverview]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filteredFixtures = useMemo(() => {
    if (!overview) return [];
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return overview.fixtures.filter((fixture) => {
      if (filter === "BROADCAST" && !fixture.broadcasts.length) return false;
      if (filter === "LIVE" && fixture.status !== "LIVE") return false;
      if (!term) return true;
      return [fixture.home.name, fixture.away.name, fixture.competition.name]
        .some((value) => value.toLocaleLowerCase("pt-BR").includes(term));
    });
  }, [filter, overview, search]);

  const liveCount = overview?.fixtures.filter((fixture) => fixture.status === "LIVE").length ?? 0;

  return (
    <AppShell stage="today">
      <div className="space-y-6">
        <ProductPageHeader
          eyebrow="Hoje"
          title="Os jogos do dia, sem ruído"
          description="Agenda do escopo acompanhado, com horário de Brasília, transmissão quando confirmada e contexto de forma e Elo sob demanda."
          meta={overview ? <StatusBadge tone="info">{formatLocalDate(overview.localDate)}</StatusBadge> : undefined}
          aside={(
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="touch-target inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/70 bg-secondary/30 px-4 type-meta font-medium text-foreground hover:bg-secondary/55 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
              Atualizar
            </button>
          )}
        />

        {loading && !overview ? (
          <LoadingState label="Carregando a agenda de hoje" rows={5} />
        ) : error && !overview ? (
          <ErrorState title="Não foi possível carregar a agenda" description={error} onRetry={() => void refresh()} />
        ) : overview ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricPreview label="Jogos acompanhados" value={String(overview.coverage.trackedFixtures)} detail="Escopo prioritário do dia" />
              <MetricPreview label="Ao vivo" value={String(liveCount)} detail="Status atual no catálogo" />
              <MetricPreview label="Transmissão" value={String(overview.coverage.confirmedBroadcastFixtures)} detail="Jogos com evidência confirmada" />
              <MetricPreview label="Cobertura Elo" value={`${overview.coverage.eloCoveredTeams}/${overview.coverage.totalTeams}`} detail="Equipes com rating atual" />
            </div>

            <SurfaceCard
              icon={CalendarDays}
              title="Agenda do dia"
              description="Uma linha por partida. Abra o confronto para ver momento recente, Elo e onde assistir."
              actions={error ? <StatusBadge tone="warning">Atualização parcial</StatusBadge> : undefined}
            >
              <div className="space-y-4">
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
                  <FilterChip active={filter === "ALL"} onClick={() => setFilter("ALL")}>Todos</FilterChip>
                  <FilterChip active={filter === "BROADCAST"} onClick={() => setFilter("BROADCAST")}>Com transmissão</FilterChip>
                  <FilterChip active={filter === "LIVE"} onClick={() => setFilter("LIVE")}>Ao vivo</FilterChip>
                </FilterBar>

                {filteredFixtures.length ? (
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
