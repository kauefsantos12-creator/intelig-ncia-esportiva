import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { GitCompareArrows, ListOrdered, RefreshCw, Search, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { EloHistoryPanel } from "@/components/EloHistoryPanel";
import { FilterBar, FilterChip, SearchField, SegmentedControl, SelectField, StatusBadge } from "@/components/ProductControls";
import { MetricPreview, ProductPageHeader, SurfaceCard } from "@/components/ProductSurface";
import { EmptyState, ErrorState, LoadingState } from "@/components/SurfaceState";
import { getEloDirectory } from "@/lib/elo-explorer.functions";

export const Route = createFileRoute("/elo")({
  head: () => ({
    meta: [
      { title: "Elo · Motor de Inteligência Esportiva" },
      { name: "description", content: "Rankings Elo de clubes e ligas com contexto hierárquico e histórico." },
    ],
  }),
  component: EloPage,
});

type EloDirectory = Awaited<ReturnType<typeof getEloDirectory>>;
type RankingMode = "TEAMS" | "LEAGUES";
type EloSort =
  | "RANK"
  | "RATING_DESC"
  | "RATING_ASC"
  | "NAME_ASC"
  | "LEAGUE_ASC"
  | "MATCHES_DESC"
  | "COUNTRY_ASC"
  | "DIVISION_ASC";

const PAGE_SIZE = 50;

const ratingFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const snapshotFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const regionLabels: Record<string, string> = {
  EUROPE: "Europa",
  SOUTH_AMERICA: "América do Sul",
  NORTH_AMERICA: "América do Norte",
  ASIA: "Ásia",
  AFRICA: "África",
  OCEANIA: "Oceania",
};

function formatRating(value: number | null | undefined) {
  return typeof value === "number" ? ratingFormatter.format(value) : "—";
}

function formatSnapshotMoment(value: string | null | undefined) {
  return value ? snapshotFormatter.format(new Date(value)) : "—";
}

function EloPage() {
  const loadDirectory = useServerFn(getEloDirectory);
  const [directory, setDirectory] = useState<EloDirectory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<RankingMode>("TEAMS");
  const [region, setRegion] = useState("ALL");
  const [country, setCountry] = useState("ALL");
  const [league, setLeague] = useState("ALL");
  const [division, setDivision] = useState("ALL");
  const [sort, setSort] = useState<EloSort>("RANK");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDirectory(await loadDirectory());
    } catch {
      setError("Os rankings Elo não puderam ser carregados agora.");
    } finally {
      setLoading(false);
    }
  }, [loadDirectory]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const regions = useMemo(() => {
    if (!directory) return [];
    return Array.from(new Set(directory.leagues.map((league) => league.region).filter((value): value is string => Boolean(value)))).sort();
  }, [directory]);

  const countries = useMemo(() => {
    if (!directory) return [];
    return Array.from(new Set(
      directory.leagues
        .filter((league) => region === "ALL" || league.region === region)
        .map((league) => league.country_code)
        .filter((value): value is string => Boolean(value)),
    )).sort();
  }, [directory, region]);

  useEffect(() => {
    if (country !== "ALL" && !countries.includes(country)) setCountry("ALL");
  }, [countries, country]);

  const divisions = useMemo(() => {
    if (!directory) return [];
    return Array.from(new Set(
      directory.leagues
        .filter((item) => region === "ALL" || item.region === region)
        .filter((item) => country === "ALL" || item.country_code === country)
        .map((item) => item.division_level)
        .filter((value): value is number => value !== null),
    )).sort((a, b) => a - b);
  }, [country, directory, region]);

  const leagueOptions = useMemo(() => {
    if (!directory) return [];
    return directory.leagues
      .filter((item) => region === "ALL" || item.region === region)
      .filter((item) => country === "ALL" || item.country_code === country)
      .filter((item) => division === "ALL" || String(item.division_level) === division)
      .slice()
      .sort((a, b) => a.league_name.localeCompare(b.league_name, "pt-BR"));
  }, [country, directory, division, region]);

  useEffect(() => {
    if (division !== "ALL" && !divisions.includes(Number(division))) setDivision("ALL");
  }, [division, divisions]);

  useEffect(() => {
    if (league !== "ALL" && !leagueOptions.some((item) => String(item.league_id) === league)) {
      setLeague("ALL");
    }
  }, [league, leagueOptions]);

  useEffect(() => {
    setPage(1);
  }, [mode, region, country, league, division, sort, search]);

  const teamRankById = useMemo(() => {
    const ranks = new Map<number, number>();
    directory?.teams.forEach((team, index) => {
      if (team.team_id !== null) ranks.set(team.team_id, index + 1);
    });
    return ranks;
  }, [directory]);

  const leagueRankById = useMemo(() => {
    const ranks = new Map<number, number>();
    directory?.leagues.forEach((league, index) => ranks.set(league.league_id, index + 1));
    return ranks;
  }, [directory]);

  const filteredTeams = useMemo(() => {
    if (!directory) return [];
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const rows = directory.teams.filter((team) => {
      if (region !== "ALL" && team.region !== region) return false;
      if (country !== "ALL" && team.countryCode !== country) return false;
      if (league !== "ALL" && String(team.league_id) !== league) return false;
      if (division !== "ALL" && String(team.divisionLevel) !== division) return false;
      if (!term) return true;
      return [team.team_name, team.league_name].some((value) =>
        value?.toLocaleLowerCase("pt-BR").includes(term) ?? false
      );
    });

    return rows.slice().sort((a, b) => {
      if (sort === "RATING_DESC") return (b.global_rating ?? -Infinity) - (a.global_rating ?? -Infinity);
      if (sort === "RATING_ASC") return (a.global_rating ?? Infinity) - (b.global_rating ?? Infinity);
      if (sort === "NAME_ASC") return a.team_name.localeCompare(b.team_name, "pt-BR");
      if (sort === "LEAGUE_ASC") {
        return a.league_name.localeCompare(b.league_name, "pt-BR")
          || a.team_name.localeCompare(b.team_name, "pt-BR");
      }
      if (sort === "MATCHES_DESC") {
        return (b.matches_processed ?? -1) - (a.matches_processed ?? -1)
          || (b.global_rating ?? -Infinity) - (a.global_rating ?? -Infinity);
      }
      return (teamRankById.get(a.team_id ?? -1) ?? Number.MAX_SAFE_INTEGER)
        - (teamRankById.get(b.team_id ?? -1) ?? Number.MAX_SAFE_INTEGER);
    });
  }, [country, directory, division, league, region, search, sort, teamRankById]);

  const filteredLeagues = useMemo(() => {
    if (!directory) return [];
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const rows = directory.leagues.filter((item) => {
      if (region !== "ALL" && item.region !== region) return false;
      if (country !== "ALL" && item.country_code !== country) return false;
      if (division !== "ALL" && String(item.division_level) !== division) return false;
      if (!term) return true;
      return item.league_name.toLocaleLowerCase("pt-BR").includes(term);
    });

    return rows.slice().sort((a, b) => {
      if (sort === "RATING_DESC") return (b.rating ?? -Infinity) - (a.rating ?? -Infinity);
      if (sort === "RATING_ASC") return (a.rating ?? Infinity) - (b.rating ?? Infinity);
      if (sort === "NAME_ASC") return a.league_name.localeCompare(b.league_name, "pt-BR");
      if (sort === "COUNTRY_ASC") {
        return (a.country_code ?? "").localeCompare(b.country_code ?? "", "pt-BR")
          || a.league_name.localeCompare(b.league_name, "pt-BR");
      }
      if (sort === "DIVISION_ASC") {
        return (a.division_level ?? Number.MAX_SAFE_INTEGER) - (b.division_level ?? Number.MAX_SAFE_INTEGER)
          || a.league_name.localeCompare(b.league_name, "pt-BR");
      }
      return (leagueRankById.get(a.league_id) ?? Number.MAX_SAFE_INTEGER)
        - (leagueRankById.get(b.league_id) ?? Number.MAX_SAFE_INTEGER);
    });
  }, [country, directory, division, leagueRankById, region, search, sort]);

  const selectedTeam = selectedTeamId === null
    ? null
    : directory?.teams.find((team) => team.team_id === selectedTeamId) ?? null;
  const selectedTeamRank = selectedTeam?.team_id !== null && selectedTeam?.team_id !== undefined
    ? teamRankById.get(selectedTeam.team_id) ?? null
    : null;
  const topTeam = directory?.teams[0] ?? null;
  const topLeague = directory?.leagues[0] ?? null;
  const hierarchyConstrained = directory?.leagues.filter((league) => league.hierarchy_constrained).length ?? 0;
  const visibleCount = mode === "TEAMS" ? filteredTeams.length : filteredLeagues.length;
  const totalCount = mode === "TEAMS" ? directory?.teams.length ?? 0 : directory?.leagues.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(visibleCount / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, visibleCount);
  const pagedTeams = filteredTeams.slice(pageStart, pageEnd);
  const pagedLeagues = filteredLeagues.slice(pageStart, pageEnd);
  const snapshotHealthy = directory?.snapshot.status === "OK";
  const snapshotCoverage = directory
    && directory.snapshot.domesticCurrent !== null
    && directory.snapshot.domesticTargets !== null
    && directory.snapshot.crossCurrent !== null
    && directory.snapshot.crossTargets !== null
      ? `${directory.snapshot.domesticCurrent}/${directory.snapshot.domesticTargets} ligas · ${directory.snapshot.crossCurrent}/${directory.snapshot.crossTargets} cross`
      : "Cobertura indisponível";

  return (
    <AppShell stage="elo">
      <div className="space-y-6">
        <ProductPageHeader
          eyebrow="Elo"
          title="Força relativa, com contexto"
          description="Compare o ranking atual, refine por região ou país e abra o histórico point-in-time de cada clube sem recalcular o modelo no navegador."
          meta={directory ? (
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={snapshotHealthy ? "success" : "warning"}>
                {snapshotHealthy ? "Snapshot diário OK" : `Snapshot ${directory.snapshot.status}`}
              </StatusBadge>
              <StatusBadge tone="neutral">Fechamento diário · 05:05</StatusBadge>
            </div>
          ) : undefined}
          aside={(
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="touch-target inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/70 bg-secondary/30 px-4 type-meta font-medium text-foreground hover:bg-secondary/55 disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
              Atualizar
            </button>
          )}
        />

        {loading && !directory ? (
          <LoadingState label="Carregando rankings Elo" rows={6} />
        ) : error && !directory ? (
          <ErrorState description={error} onRetry={() => void refresh()} />
        ) : directory ? (
          <>
            <div
              className="grid gap-3 rounded-2xl border border-border/70 bg-secondary/20 px-4 py-4 sm:grid-cols-3"
              aria-label="Referência temporal do Elo"
            >
              <div>
                <p className="type-caption uppercase tracking-[0.06em] text-muted-foreground">Snapshot fechado</p>
                <p className="mt-1 type-label text-foreground">{formatSnapshotMoment(directory.snapshot.completedAt)}</p>
              </div>
              <div>
                <p className="type-caption uppercase tracking-[0.06em] text-muted-foreground">Partidas consideradas até</p>
                <p className="mt-1 type-label text-foreground">{formatSnapshotMoment(directory.snapshot.latestTeamFixtureAt)}</p>
              </div>
              <div>
                <p className="type-caption uppercase tracking-[0.06em] text-muted-foreground">Cobertura da rodada</p>
                <p className="mt-1 type-label text-foreground">{snapshotCoverage}</p>
              </div>
              <p className="type-caption text-muted-foreground sm:col-span-3">
                O ranking Elo é um snapshot diário. Jogos encerrados depois do fechamento entram no próximo processamento das 05:05 de Brasília.
              </p>
            </div>

            <SurfaceCard
              icon={mode === "TEAMS" ? ListOrdered : GitCompareArrows}
              title={mode === "TEAMS" ? "Ranking de clubes" : "Ranking de ligas"}
              description={mode === "TEAMS" ? "Elo global atual = rating local + ajuste de força da liga." : "Força relativa entre competições, respeitando a hierarquia do modelo."}
              actions={(
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <StatusBadge tone="neutral">{visibleCount} de {totalCount}</StatusBadge>
                  <SegmentedControl
                    label="Tipo de ranking"
                    value={mode}
                    options={[{ value: "TEAMS", label: "Clubes" }, { value: "LEAGUES", label: "Ligas" }]}
                    onChange={setMode}
                  />
                </div>
              )}
            >
              <div className="space-y-4">
                <FilterBar
                  label="Filtrar ranking Elo"
                  trailing={(
                    <SearchField
                      label={mode === "TEAMS" ? "Buscar clube ou competição" : "Buscar competição"}
                      placeholder={mode === "TEAMS" ? "Buscar clube ou competição" : "Buscar competição"}
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="w-full sm:w-72"
                    />
                  )}
                >
                  <FilterChip active={region === "ALL"} onClick={() => setRegion("ALL")}>Todas as regiões</FilterChip>
                  {regions.map((value) => (
                    <FilterChip key={value} active={region === value} onClick={() => setRegion(value)}>{regionLabels[value] ?? value}</FilterChip>
                  ))}
                </FilterBar>

                {countries.length ? (
                  <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar por país">
                    <FilterChip active={country === "ALL"} onClick={() => setCountry("ALL")}>Todos os países</FilterChip>
                    {countries.map((value) => <FilterChip key={value} active={country === value} onClick={() => setCountry(value)}>{value}</FilterChip>)}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-2 type-caption text-muted-foreground">
                  <span>Exibindo {visibleCount} {mode === "TEAMS" ? "clubes" : "ligas"} na ordem do ranking global.</span>
                  {(region !== "ALL" || country !== "ALL" || search) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRegion("ALL");
                        setCountry("ALL");
                        setSearch("");
                      }}
                      className="touch-target inline-flex min-h-11 items-center rounded-xl px-3 type-meta font-medium text-primary hover:bg-primary/8"
                    >
                      Limpar filtros
                    </button>
                  ) : null}
                </div>

                {mode === "TEAMS" && selectedTeam ? (
                  <div className="flex flex-col gap-3 rounded-xl border border-primary/25 bg-primary/8 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="type-caption uppercase tracking-[0.06em] text-muted-foreground">Clube selecionado</p>
                      <p className="mt-1 truncate type-label text-foreground">
                        {selectedTeamRank ? `#${selectedTeamRank} · ` : ""}{selectedTeam.team_name} · Elo {formatRating(selectedTeam.global_rating)}
                      </p>
                    </div>
                    <a
                      href="#elo-history"
                      className="touch-target inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-4 type-meta font-semibold text-primary hover:bg-primary/15"
                    >
                      Ver histórico de 60 dias
                    </a>
                  </div>
                ) : null}

                {mode === "TEAMS" ? (
                  filteredTeams.length ? (
                    <div className="overflow-hidden rounded-2xl border border-border/70">
                      <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_5.5rem] gap-3 bg-secondary/35 px-4 py-2.5 type-caption uppercase tracking-[0.06em] text-muted-foreground sm:grid-cols-[3.5rem_minmax(0,1fr)_8rem_5.5rem]">
                        <span>#</span><span>Clube</span><span className="hidden sm:block">Liga</span><span className="text-right">Elo</span>
                      </div>
                      <div className="divide-y divide-border/60">
                        {filteredTeams.slice(0, 100).map((team, index) => {
                          const teamId = team.team_id;
                          const selectable = teamId !== null;
                          const selected = selectable && teamId === selectedTeamId;
                          const globalRank = selectable ? teamRankById.get(teamId) ?? index + 1 : index + 1;
                          return (
                            <button
                              key={`${team.team_model_version}:${team.team_id}`}
                              type="button"
                              disabled={!selectable}
                              onClick={() => {
                                if (selectable) setSelectedTeamId(teamId);
                              }}
                              aria-pressed={selected}
                              aria-label={`Selecionar ${team.team_name} para consultar o histórico Elo`}
                              className={`grid min-h-12 w-full grid-cols-[3.5rem_minmax(0,1fr)_5.5rem] items-center gap-3 px-4 py-3 text-left transition-colors sm:grid-cols-[3.5rem_minmax(0,1fr)_8rem_5.5rem] ${selected ? "bg-primary/10" : "hover:bg-secondary/25"} disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                              <span className="type-meta text-muted-foreground">{globalRank}</span>
                              <div className="min-w-0">
                                <p className="truncate type-label text-foreground">{team.team_name}</p>
                                <p className="mt-0.5 truncate type-caption text-muted-foreground sm:hidden">{team.league_name}</p>
                              </div>
                              <span className="hidden truncate type-caption text-muted-foreground sm:block">{team.league_name}</span>
                              <span className="text-right type-metric text-foreground">{formatRating(team.global_rating)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <EmptyState icon={search ? Search : ListOrdered} title="Nenhum clube encontrado" description="Altere região, país ou busca para ampliar o ranking." />
                  )
                ) : filteredLeagues.length ? (
                  <div className="overflow-hidden rounded-2xl border border-border/70">
                    <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_5.5rem] gap-3 bg-secondary/35 px-4 py-2.5 type-caption uppercase tracking-[0.06em] text-muted-foreground sm:grid-cols-[3.5rem_minmax(0,1fr)_7rem_6rem_5.5rem]">
                      <span>#</span><span>Liga</span><span className="hidden sm:block">País</span><span className="hidden sm:block">Divisão</span><span className="text-right">Rating</span>
                    </div>
                    <div className="divide-y divide-border/60">
                      {filteredLeagues.slice(0, 100).map((league, index) => {
                        const globalRank = leagueRankById.get(league.league_id) ?? index + 1;
                        return (
                          <div key={`${league.model_version}:${league.league_id}`} className="grid min-h-12 grid-cols-[3.5rem_minmax(0,1fr)_5.5rem] items-center gap-3 px-4 py-3 sm:grid-cols-[3.5rem_minmax(0,1fr)_7rem_6rem_5.5rem]">
                            <span className="type-meta text-muted-foreground">{globalRank}</span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate type-label text-foreground">{league.league_name}</p>
                                {league.hierarchy_constrained ? <StatusBadge tone="info">hierarquia</StatusBadge> : null}
                              </div>
                              <p className="mt-0.5 type-caption text-muted-foreground sm:hidden">{league.country_code ?? "—"} · divisão {league.division_level ?? "—"}</p>
                            </div>
                            <span className="hidden type-caption text-muted-foreground sm:block">{league.country_code ?? "—"}</span>
                            <span className="hidden type-caption text-muted-foreground sm:block">{league.division_level ?? "—"}</span>
                            <span className="text-right type-metric text-foreground">{formatRating(league.rating)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={search ? Search : GitCompareArrows} title="Nenhuma liga encontrada" description="Altere região, país ou busca para ampliar o ranking." />
                )}

                {error ? <p className="type-caption text-warning">A atualização mais recente falhou; exibindo a última leitura disponível.</p> : null}
              </div>
            </SurfaceCard>

            <div id="elo-history" className="scroll-mt-24 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.65fr)]">
              <EloHistoryPanel teamId={selectedTeamId} teamName={selectedTeam?.team_name ?? null} />
              <SurfaceCard icon={TrendingUp} title="Como ler" description="O frontend exibe ratings calculados e persistidos pelo backend." tone="subtle">
                <div className="space-y-3 type-meta text-muted-foreground">
                  <p><strong className="text-foreground">Elo global atual:</strong> combina rating local do clube com o ajuste da força da liga.</p>
                  <p><strong className="text-foreground">Histórico:</strong> mostra a escala local point-in-time registrada em cada fixture, sem recalcular o passado com informação futura.</p>
                  <p><strong className="text-foreground">Ligas:</strong> podem carregar restrições hierárquicas entre divisões quando o modelo assim determina.</p>
                </div>
              </SurfaceCard>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo do universo Elo">
              <MetricPreview label="Clubes" value={String(directory.teams.length)} detail="Equipes com rating global atual" />
              <MetricPreview label="Ligas" value={String(directory.leagues.length)} detail="Competições no ranking hierárquico" />
              <MetricPreview label="Líder global" value={topTeam?.team_name ?? "—"} detail={topTeam ? `Elo ${formatRating(topTeam.global_rating)}` : "Sem rating disponível"} />
              <MetricPreview label="Liga mais forte" value={topLeague?.league_name ?? "—"} detail={topLeague ? `Rating ${formatRating(topLeague.rating)} · ${hierarchyConstrained} ligas com restrição hierárquica` : "Sem rating disponível"} />
            </div>
          </>
        ) : (
          <EmptyState icon={ListOrdered} title="Sem rankings Elo disponíveis" description="O catálogo ainda não possui ratings processados para exibição." />
        )}
      </div>
    </AppShell>
  );
}
