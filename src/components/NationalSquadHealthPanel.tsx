import { useServerFn } from "@tanstack/react-start";
import { Activity, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { StatusBadge } from "@/components/ProductControls";
import { MetricPreview, SurfaceCard } from "@/components/ProductSurface";
import { ErrorState, LoadingState } from "@/components/SurfaceState";
import {
  getNationalSquadHealth,
  type NationalSquadHealth,
  type NationalSquadLeagueHealth,
} from "@/lib/national-squad-health.functions";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function ratio(value: number, total: number) {
  return total ? `${value}/${total}` : "0/0";
}

function quotaLabel(row: NationalSquadLeagueHealth) {
  if (row.quotaState === "DAILY_LIMIT") return "Limite diário";
  if (row.quotaState === "RATE_LIMIT") return "Rate limit";
  return "Quota livre";
}

function healthLabel(row: NationalSquadLeagueHealth) {
  if (row.deadJobs > 0) return { label: "Requer atenção", tone: "warning" as const };
  if (row.currentClubs === 0) {
    if (row.quotaState !== "OK") return { label: "Aguardando quota", tone: "warning" as const };
    return { label: "Catálogo pendente", tone: "neutral" as const };
  }
  if (row.mappedApiIds === row.currentClubs && row.squadsFresh === row.currentClubs) {
    return { label: "Cobertura completa", tone: "success" as const };
  }
  if (row.quotaState !== "OK") return { label: "Aguardando quota", tone: "warning" as const };
  return { label: "Em preenchimento", tone: "info" as const };
}

export function NationalSquadHealthPanel() {
  const loadHealth = useServerFn(getNationalSquadHealth);
  const [health, setHealth] = useState<NationalSquadHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setHealth(await loadHealth());
    } catch {
      setError("A cobertura dos elencos nacionais não pôde ser carregada agora.");
    } finally {
      setLoading(false);
    }
  }, [loadHealth]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const generatedAt = useMemo(
    () => health ? dateTimeFormatter.format(new Date(health.generatedAt)) : null,
    [health],
  );

  return (
    <SurfaceCard
      icon={Activity}
      title="Saúde dos elencos nacionais"
      description="Cobertura das seis ligas prioritárias: clubes atuais, reconciliação de IDs, elencos e fila de preenchimento. A leitura deste painel não consome quota dos provedores."
      actions={(
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="touch-target inline-flex min-h-10 items-center gap-2 rounded-xl border border-border/70 bg-secondary/30 px-3 type-meta font-medium text-foreground hover:bg-secondary/55 disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
          Atualizar cobertura
        </button>
      )}
    >
      {loading && !health ? (
        <LoadingState label="Calculando cobertura dos elencos" rows={6} />
      ) : error && !health ? (
        <ErrorState description={error} onRetry={() => void refresh()} />
      ) : health ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricPreview label="Clubes atuais" value={String(health.totals.currentClubs)} detail="Memberships 5Dollar nas seis ligas" />
            <MetricPreview label="IDs reconciliados" value={ratio(health.totals.mappedApiIds, health.totals.currentClubs)} detail="Clubes aptos a buscar elenco" />
            <MetricPreview label="Elencos frescos" value={ratio(health.totals.squadsFresh, health.totals.currentClubs)} detail={`${health.totals.squadsLoaded} clubes com algum elenco carregado`} />
            <MetricPreview label="Jobs pendentes" value={String(health.totals.pendingJobs)} detail={health.totals.deadJobs ? `${health.totals.deadJobs} em DEAD` : "Nenhum job em DEAD"} />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border/70">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[minmax(11rem,1.4fr)_6rem_7rem_7rem_7rem_9rem] gap-3 bg-secondary/35 px-4 py-2.5 type-caption uppercase tracking-[0.06em] text-muted-foreground">
                <span>Liga</span><span>Clubes</span><span>IDs API</span><span>Elencos</span><span>Fila</span><span>Quota</span>
              </div>
              <div className="divide-y divide-border/60">
                {health.leagues.map((row) => {
                  const state = healthLabel(row);
                  return (
                    <div key={row.leagueId} className="grid grid-cols-[minmax(11rem,1.4fr)_6rem_7rem_7rem_7rem_9rem] items-center gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="truncate type-label text-foreground">{row.leagueName}</p>
                          <StatusBadge tone={state.tone}>{state.label}</StatusBadge>
                        </div>
                        <p className="mt-1 truncate type-caption text-muted-foreground">Catálogo: {row.catalogStatus}</p>
                      </div>
                      <span className="type-metric text-foreground">{row.currentClubs}</span>
                      <div>
                        <p className="type-metric text-foreground">{ratio(row.mappedApiIds, row.currentClubs)}</p>
                        <p className="type-caption text-muted-foreground">reconciliados</p>
                      </div>
                      <div>
                        <p className="type-metric text-foreground">{ratio(row.squadsFresh, row.currentClubs)}</p>
                        <p className="type-caption text-muted-foreground">{row.squadsLoaded} carregados</p>
                      </div>
                      <div>
                        <p className="type-metric text-foreground">{row.pendingJobs}</p>
                        <p className="type-caption text-muted-foreground">{row.deadJobs ? `${row.deadJobs} DEAD` : "ativos"}</p>
                      </div>
                      <div className="min-w-0">
                        <StatusBadge tone={row.quotaState === "OK" ? "success" : "warning"}>{quotaLabel(row)}</StatusBadge>
                        <p className="mt-1 truncate type-caption text-muted-foreground" title={row.lastError ?? undefined}>
                          {row.retryAt ? `Retoma ${dateTimeFormatter.format(new Date(row.retryAt))}` : row.quotaState === "OK" ? "Sem bloqueio detectado" : "Aguardando nova tentativa"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="type-caption text-muted-foreground">
            Atualizado em {generatedAt}. Elenco fresco = ao menos um registro ativo carregado nos últimos 7 dias. Jobs FAILED com retry continuam contabilizados como pendentes; DEAD aparece separadamente.
          </p>
        </div>
      ) : null}
    </SurfaceCard>
  );
}
