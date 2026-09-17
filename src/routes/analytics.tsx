import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, CalendarDays, RefreshCw, Search, ShieldCheck, UsersRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { FilterBar, FilterChip, SearchField, StatusBadge } from "@/components/ProductControls";
import { MetricPreview, ProductPageHeader, SurfaceCard } from "@/components/ProductSurface";
import { EmptyState, ErrorState, LoadingState } from "@/components/SurfaceState";
import {
  getAnalyticsDirectory,
  getAnalyticsTeamDetail,
  type AnalyticsStanding,
  type AnalyticsTeamDetail,
} from "@/lib/analytics-overview.functions";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics · Motor de Inteligência Esportiva" },
      { name: "description", content: "Analytics 26/27 por competição, equipe, elenco, jogadores e calendário." },
    ],
  }),
  component: AnalyticsPage,
});

type AnalyticsDirectory = Awaited<ReturnType<typeof getAnalyticsDirectory>>;

const regionLabels: Record<string, string> = {
  EUROPE: "Europa",
  SOUTH_AMERICA: "América do Sul",
  NORTH_AMERICA: "América do Norte",
  ASIA: "Ásia",
  AFRICA: "África",
  OCEANIA: "Oceania",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "short",
});
const decimalFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

function formatNumber(value: number | null) {
  return value === null ? "—" : decimalFormatter.format(value);
}

function goalDifference(row: AnalyticsStanding) {
  if (row.goalsFor === null || row.goalsAgainst === null) return null;
  return row.goalsFor - row.goalsAgainst;
}

function AnalyticsPage() {
  const loadDirectory = useServerFn(getAnalyticsDirectory);
  const loadTeamDetail = useServerFn(getAnalyticsTeamDetail);
  const [directory, setDirectory] = useState<AnalyticsDirectory | null>(null);
  const [detail, setDetail] = useState<AnalyticsTeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [region, setRegion] = useState("ALL");
  const [country, setCountry] = useState("ALL");
  const [competitionId, setCompetitionId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDirectory(await loadDirectory());
    } catch {
      setError("Os dados de Analytics não puderam ser carregados agora.");
    } finally {
      setLoading(false);
    }
  }, [loadDirectory]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const regions = useMemo(() => {
    if (!directory) return [];
    return [...new Set(directory.competitions.map((item) => item.region).filter((value): value is string => Boolean(value)))].sort();
  }, [directory]);

  const countries = useMemo(() => {
    if (!directory) return [];
    return [...new Set(
      directory.competitions
        .filter((item) => region === "ALL" || item.region === region)
        .map((item) => item.countryCode)
        .filter((value): value is string => Boolean(value)),
    )].sort();
  }, [directory, region]);

  const competitions = useMemo(() => {
    if (!directory) return [];
    return directory.competitions.filter(
      (item) =>
        (region === "ALL" || item.region === region) &&
        (country === "ALL" || item.countryCode === country),
    );
  }, [country, directory, region]);

  useEffect(() => {
    if (country !== "ALL" && !countries.includes(country)) setCountry("ALL");
  }, [countries, country]);

  useEffect(() => {
    if (competitionId && !competitions.some((item) => item.id === competitionId)) {
      setCompetitionId(null);
      setTeamId(null);
      setDetail(null);
    }
  }, [competitionId, competitions]);

  const selectedCompetition = directory?.competitions.find((item) => item.id === competitionId) ?? null;
  const teams = useMemo(() => {
    if (!directory || !competitionId) return [];
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return directory.standings
      .filter((row) => row.competitionId === competitionId)
      .filter((row) => !term || row.teamName.toLocaleLowerCase("pt-BR").includes(term));
  }, [competitionId, directory, search]);

  const selectedTeam = directory?.standings.find(
    (row) => row.competitionId === competitionId && row.teamId === teamId,
  ) ?? null;

  const selectTeam = useCallback(async (row: AnalyticsStanding) => {
    if (!directory) return;
    setTeamId(row.teamId);
    setDetail(null);
    setDetailLoading(true);
    setDetailError(null);
    try {
      setDetail(await loadTeamDetail({
        data: { competitionId: row.competitionId, teamId: row.teamId, season: directory.season },
      }));
    } catch {
      setDetailError("O detalhamento da equipe não pôde ser carregado agora.");
    } finally {
      setDetailLoading(false);
    }
  }, [directory, loadTeamDetail]);

  const completedFixtures = detail?.fixtures.filter((fixture) => fixture.status === "FINISHED") ?? [];
  const nextFixtures = detail?.fixtures
    .filter((fixture) => fixture.status === "SCHEDULED")
    .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt))
    .slice(0, 5) ?? [];

  const averageRating = useMemo(() => {
    const ratings = detail?.players.map((player) => player.providerRating).filter((value): value is number => value !== null) ?? [];
    return ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : null;
  }, [detail]);

  return (
    <AppShell stage="analytics">
      <div className="space-y-6">
        <ProductPageHeader
          eyebrow="Analytics 26/27"
          title="Da competição ao jogador"
          description="Explore competições e equipes a partir dos jogos carregados. Classificação, elenco e métricas enriquecem a análise quando a fonte correspondente estiver disponível."
          meta={<StatusBadge tone="info">Temporada 2026/27</StatusBadge>}
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
          <LoadingState label="Carregando Analytics 26/27" rows={6} />
        ) : error && !directory ? (
          <ErrorState description={error} onRetry={() => void refresh()} />
        ) : directory ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricPreview label="Competições" value={String(directory.competitions.length)} detail="Com partidas carregadas" />
              <MetricPreview label="Equipes" value={String(directory.coverage.teams)} detail="Derivadas dos fixtures 26/27" />
              <MetricPreview label="Com classificação" value={String(directory.coverage.teamsWithStanding)} detail={`${directory.coverage.competitionsWithStanding} competições com standings`} />
              <MetricPreview label="Atualizado" value={new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(directory.generatedAt))} detail="Catálogo lido no servidor" />
            </div>

            <SurfaceCard
              icon={BarChart3}
              title="Contexto analítico"
              description="Região e país reduzem as competições disponíveis. A ausência de standings não remove a competição nem suas equipes."
            >
              <div className="space-y-4">
                <FilterBar label="Filtrar Analytics">
                  <FilterChip active={region === "ALL"} onClick={() => setRegion("ALL")}>Todas as regiões</FilterChip>
                  {regions.map((value) => (
                    <FilterChip key={value} active={region === value} onClick={() => setRegion(value)}>{regionLabels[value] ?? value}</FilterChip>
                  ))}
                </FilterBar>

                {countries.length ? (
                  <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar por país">
                    <FilterChip active={country === "ALL"} onClick={() => setCountry("ALL")}>Todos os países</FilterChip>
                    {countries.map((value) => (
                      <FilterChip key={value} active={country === value} onClick={() => setCountry(value)}>{value}</FilterChip>
                    ))}
                  </div>
                ) : null}

                {competitions.length ? (
                  <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Escolher competição">
                    {competitions.map((competition) => (
                      <FilterChip
                        key={competition.id}
                        active={competitionId === competition.id}
                        onClick={() => {
                          setCompetitionId(competition.id);
                          setTeamId(null);
                          setDetail(null);
                          setSearch("");
                        }}
                      >
                        {competition.name}
                      </FilterChip>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={BarChart3} title="Sem competição neste recorte" description="Amplie os filtros para localizar competições com partidas 26/27 carregadas." />
                )}
              </div>
            </SurfaceCard>

            {selectedCompetition ? (
              <SurfaceCard
                icon={ShieldCheck}
                title={selectedCompetition.name}
                description={`${selectedCompetition.countryCode ?? regionLabels[selectedCompetition.region ?? ""] ?? selectedCompetition.region ?? "Escopo internacional"} · ${selectedCompetition.season}`}
                actions={(
                  <SearchField
                    label="Buscar equipe"
                    placeholder="Buscar equipe"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full sm:w-64"
                  />
                )}
              >
                {teams.length ? (
                  <div className="overflow-hidden rounded-2xl border border-border/70">
                    <div className="grid grid-cols-[minmax(0,1fr)_6rem_5rem] gap-2 bg-secondary/35 px-3 py-2.5 type-caption uppercase tracking-[0.06em] text-muted-foreground sm:grid-cols-[minmax(0,1fr)_5rem_5rem_5rem_5rem]">
                      <span>Equipe</span><span>Status</span><span>Pts</span><span className="hidden sm:block">J</span><span className="hidden sm:block">Pos.</span>
                    </div>
                    <div className="divide-y divide-border/60">
                      {teams.map((row) => (
                        <button
                          key={row.teamId}
                          type="button"
                          aria-pressed={teamId === row.teamId}
                          onClick={() => void selectTeam(row)}
                          className={`grid w-full grid-cols-[minmax(0,1fr)_6rem_5rem] items-center gap-2 px-3 py-3 text-left transition-colors sm:grid-cols-[minmax(0,1fr)_5rem_5rem_5rem_5rem] ${teamId === row.teamId ? "bg-primary/10" : "hover:bg-secondary/25"}`}
                        >
                          <div className="min-w-0">
                            <p className="truncate type-label text-foreground">{row.teamName}</p>
                            <p className="mt-0.5 type-caption text-muted-foreground">{row.hasStanding ? "Classificação disponível" : "Classificação ainda indisponível"}</p>
                          </div>
                          <span className="type-caption text-muted-foreground">{row.hasStanding ? "Completo" : "Base"}</span>
                          <span className="type-metric text-foreground">{row.hasStanding ? row.points ?? "—" : "—"}</span>
                          <span className="hidden type-meta text-muted-foreground sm:block">{row.hasStanding ? row.played ?? "—" : "—"}</span>
                          <span className="hidden type-meta text-muted-foreground sm:block">{row.hasStanding && row.position ? `${row.position}º` : "—"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={search ? Search : ShieldCheck} title="Nenhuma equipe encontrada" description="Altere a busca ou escolha outra competição." />
                )}
              </SurfaceCard>
            ) : (
              <SurfaceCard icon={ShieldCheck} title="Equipes" description="Escolha uma competição para abrir as equipes detectadas nos fixtures." tone="subtle">
                <EmptyState icon={ShieldCheck} title="Escolha uma competição" description="As equipes aparecem mesmo quando a classificação ainda não foi carregada." />
              </SurfaceCard>
            )}

            {selectedTeam ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricPreview label="Posição" value={selectedTeam.hasStanding && selectedTeam.position ? `${selectedTeam.position}º` : "—"} detail={selectedTeam.hasStanding ? `${selectedTeam.points ?? "—"} pontos em ${selectedTeam.played ?? "—"} jogos` : "Standing ainda não carregado"} />
                  <MetricPreview label="Campanha" value={selectedTeam.hasStanding ? `${selectedTeam.wins ?? "—"}V · ${selectedTeam.draws ?? "—"}E · ${selectedTeam.losses ?? "—"}D` : "—"} detail="Disponível somente com classificação" />
                  <MetricPreview label="Gols" value={selectedTeam.hasStanding ? `${selectedTeam.goalsFor ?? "—"}:${selectedTeam.goalsAgainst ?? "—"}` : "—"} detail={selectedTeam.hasStanding && goalDifference(selectedTeam) !== null ? `Saldo ${goalDifference(selectedTeam)}` : "Disponível somente com classificação"} />
                  <MetricPreview label="Rating médio" value={formatNumber(averageRating)} detail="Jogadores com rating de temporada disponível" />
                </div>

                <SurfaceCard icon={UsersRound} title={`Elenco · ${selectedTeam.teamName}`} description="Elenco e estatísticas são carregados de forma independente da classificação.">
                  {detailLoading && !detail ? (
                    <LoadingState label="Carregando elenco e jogadores" rows={5} />
                  ) : detailError && !detail ? (
                    <ErrorState description={detailError} onRetry={() => void selectTeam(selectedTeam)} />
                  ) : detail?.players.length ? (
                    <div className="overflow-hidden rounded-2xl border border-border/70">
                      <div className="grid grid-cols-[minmax(0,1fr)_5rem_4rem] gap-3 bg-secondary/35 px-4 py-2.5 type-caption uppercase tracking-[0.06em] text-muted-foreground sm:grid-cols-[minmax(0,1fr)_7rem_4rem_5rem_4rem]">
                        <span>Jogador</span><span className="hidden sm:block">Posição</span><span>Jogos</span><span className="hidden sm:block">Minutos</span><span>Rating</span>
                      </div>
                      <div className="divide-y divide-border/60">
                        {detail.players.slice(0, 40).map((player) => (
                          <div key={player.id} className="grid grid-cols-[minmax(0,1fr)_5rem_4rem] items-center gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_7rem_4rem_5rem_4rem]">
                            <div className="min-w-0">
                              <p className="truncate type-label text-foreground">{player.jerseyNumber !== null ? `${player.jerseyNumber} · ` : ""}{player.name}</p>
                              <p className="mt-0.5 truncate type-caption text-muted-foreground">{player.nationality ?? player.position ?? "Sem nacionalidade informada"}</p>
                            </div>
                            <span className="hidden truncate type-caption text-muted-foreground sm:block">{player.position ?? "—"}</span>
                            <span className="type-meta text-muted-foreground">{player.appearances ?? "—"}</span>
                            <span className="hidden type-meta text-muted-foreground sm:block">{player.minutes ?? "—"}</span>
                            <span className="type-metric text-foreground">{formatNumber(player.providerRating)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      icon={UsersRound}
                      title={detail?.availability.squad ? "Elenco ainda não carregado" : "Fonte de elenco indisponível"}
                      description={detail?.availability.seasonStats ? "Não há jogadores neste recorte." : "A ausência de stats de temporada não impede calendário e demais painéis."}
                    />
                  )}
                </SurfaceCard>

                <SurfaceCard icon={CalendarDays} title="Calendário e resultados" description="Partidas da equipe na competição selecionada, independentemente de standings e elenco.">
                  {detailLoading && !detail ? (
                    <LoadingState label="Carregando calendário" rows={4} />
                  ) : detail?.availability.fixtures ? (
                    <div className="grid gap-5 lg:grid-cols-2">
                      <div>
                        <p className="mb-3 type-label text-foreground">Próximos jogos</p>
                        {nextFixtures.length ? (
                          <div className="space-y-2">
                            {nextFixtures.map((fixture) => (
                              <div key={fixture.id} className="rounded-xl border border-border/60 bg-secondary/20 px-3 py-3">
                                <p className="type-caption text-muted-foreground">{dateFormatter.format(new Date(fixture.kickoffAt))}</p>
                                <p className="mt-1 type-label text-foreground">{fixture.homeTeamName} × {fixture.awayTeamName}</p>
                              </div>
                            ))}
                          </div>
                        ) : <p className="type-meta text-muted-foreground">Nenhum próximo jogo carregado neste recorte.</p>}
                      </div>
                      <div>
                        <p className="mb-3 type-label text-foreground">Resultados recentes</p>
                        {completedFixtures.length ? (
                          <div className="space-y-2">
                            {completedFixtures.slice(0, 5).map((fixture) => (
                              <div key={fixture.id} className="rounded-xl border border-border/60 bg-secondary/20 px-3 py-3">
                                <p className="type-caption text-muted-foreground">{dateFormatter.format(new Date(fixture.kickoffAt))}</p>
                                <p className="mt-1 type-label text-foreground">{fixture.homeTeamName} {fixture.homeGoals ?? "—"}–{fixture.awayGoals ?? "—"} {fixture.awayTeamName}</p>
                              </div>
                            ))}
                          </div>
                        ) : <p className="type-meta text-muted-foreground">Nenhum resultado carregado neste recorte.</p>}
                      </div>
                    </div>
                  ) : (
                    <EmptyState icon={CalendarDays} title="Fonte de calendário indisponível" description="O restante do Analytics continua acessível sem transformar erro de fonte em ausência de dados." />
                  )}
                </SurfaceCard>
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
