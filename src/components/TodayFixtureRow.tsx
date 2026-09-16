import { Activity, ChevronDown, Radio, Tv } from "lucide-react";

import { StatusBadge } from "@/components/ProductControls";
import { EmptyState } from "@/components/SurfaceState";
import type { BroadcastEvidence, RecentForm, TodayFixture, TodayTeam } from "@/lib/today-overview.functions";

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : timeFormatter.format(date);
}

function statusMeta(status: string): { label: string; tone: "neutral" | "live" | "success" | "warning" } {
  if (status === "LIVE") return { label: "Ao vivo", tone: "live" };
  if (status === "FINISHED") return { label: "Encerrado", tone: "success" };
  if (status === "POSTPONED") return { label: "Adiado", tone: "warning" };
  if (status === "CANCELLED") return { label: "Cancelado", tone: "warning" };
  return { label: "Agendado", tone: "neutral" };
}

function scoreLabel(fixture: TodayFixture) {
  if (fixture.status !== "LIVE" && fixture.status !== "FINISHED") return null;
  if (fixture.homeGoals === null || fixture.awayGoals === null) return null;
  return { home: fixture.homeGoals, away: fixture.awayGoals };
}

function TeamLogo({ team }: { team: TodayTeam }) {
  if (team.logoUrl) {
    return (
      <img
        src={team.logoUrl}
        alt=""
        className="size-7 shrink-0 object-contain"
        loading="lazy"
        aria-hidden
      />
    );
  }

  const initials = team.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("pt-BR");

  return (
    <span
      className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-secondary/35 type-caption font-semibold text-muted-foreground"
      aria-hidden
    >
      {initials || "•"}
    </span>
  );
}

function MatchTeam({ team, goals }: { team: TodayTeam; goals: number | null }) {
  return (
    <div className="grid min-w-0 grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2.5">
      <TeamLogo team={team} />
      <p className="truncate type-label text-foreground">{team.name}</p>
      {goals !== null ? <span className="type-metric min-w-6 text-right text-foreground">{goals}</span> : null}
    </div>
  );
}

function FormSequence({ form }: { form: RecentForm }) {
  if (!form.sequence.length) return <span className="type-caption text-muted-foreground">Sem amostra recente</span>;
  return (
    <div className="flex flex-wrap gap-1.5" aria-label={`Últimos ${form.matches} jogos: ${form.sequence.join(", ")}`}>
      {form.sequence.map((result, index) => {
        const label = result === "W" ? "V" : result === "D" ? "E" : "D";
        const tone = result === "W" ? "success" : result === "D" ? "neutral" : "warning";
        return <StatusBadge key={`${result}-${index}`} tone={tone}>{label}</StatusBadge>;
      })}
    </div>
  );
}

function TeamForm({ team }: { team: TodayTeam }) {
  const form = team.recentForm;
  return (
    <div className="rounded-xl border border-border/55 bg-secondary/22 p-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <TeamLogo team={team} />
        <p className="truncate type-label text-foreground">{team.name}</p>
      </div>
      <div className="mt-3"><FormSequence form={form} /></div>
      {form.matches ? (
        <p className="mt-2 type-caption text-muted-foreground">
          {form.wins}V · {form.draws}E · {form.losses}D · {form.goalsFor}–{form.goalsAgainst} em gols
        </p>
      ) : null}
    </div>
  );
}

function EloBlock({ home, away }: { home: TodayTeam; away: TodayTeam }) {
  if (!home.elo && !away.elo) {
    return <EmptyState icon={Activity} title="Elo indisponível" description="Somente ratings já consolidados no ledger são exibidos." />;
  }
  const gap = home.elo && away.elo ? home.elo.globalRating - away.elo.globalRating : null;
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {[home, away].map((team) => (
          <div key={team.id} className="rounded-xl border border-border/55 bg-secondary/22 p-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <TeamLogo team={team} />
              <p className="truncate type-caption text-muted-foreground">{team.name}</p>
            </div>
            <p className="mt-2 type-metric text-foreground">{team.elo ? team.elo.globalRating.toFixed(1) : "—"}</p>
            <p className="mt-1 type-caption text-muted-foreground">Elo global</p>
          </div>
        ))}
      </div>
      {gap !== null ? <p className="type-caption text-muted-foreground">Diferença atual: {Math.abs(gap).toFixed(1)} pontos.</p> : null}
    </div>
  );
}

function BroadcastList({ broadcasts }: { broadcasts: BroadcastEvidence[] }) {
  if (!broadcasts.length) {
    return <EmptyState icon={Tv} title="Transmissão ainda não confirmada" description="Nenhuma evidência de canal ou plataforma foi registrada para esta partida." />;
  }
  return (
    <div className="space-y-2">
      {broadcasts.map((broadcast, index) => (
        <div key={`${broadcast.broadcaster}-${index}`} className="rounded-xl border border-border/55 bg-secondary/22 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="type-label text-foreground">{broadcast.broadcaster}{broadcast.platform ? ` · ${broadcast.platform}` : ""}</p>
            {broadcast.isPrimary ? <StatusBadge tone="info">Principal</StatusBadge> : null}
          </div>
          <p className="mt-1 type-caption text-muted-foreground">Fonte: {broadcast.sourceName} · verificada às {formatTime(broadcast.checkedAt)}</p>
          {broadcast.sourceUrl ? (
            <a href={broadcast.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-9 items-center type-caption font-medium text-primary underline-offset-4 hover:underline">
              Abrir fonte
            </a>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function TodayFixtureRow({ fixture }: { fixture: TodayFixture }) {
  const status = statusMeta(fixture.status);
  const score = scoreLabel(fixture);
  const hasBroadcast = fixture.broadcasts.length > 0;

  return (
    <details className="group overflow-hidden rounded-2xl border border-border/60 bg-secondary/18 transition-colors open:bg-secondary/24">
      <summary className="touch-target cursor-pointer list-none px-4 py-4 marker:hidden sm:px-5">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="max-w-full truncate type-caption text-muted-foreground">{fixture.competition.name}</p>
              <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
              {hasBroadcast ? (
                <StatusBadge tone="info"><Tv className="mr-1 size-3.5" aria-hidden /> Transmissão</StatusBadge>
              ) : null}
            </div>

            <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-[76px_minmax(0,1fr)] sm:items-center">
              <div className="flex items-baseline gap-2 sm:block">
                <p className="type-metric text-foreground">{formatTime(fixture.kickoffAt)}</p>
                <p className="type-caption text-muted-foreground sm:mt-1">Brasília</p>
              </div>

              <div className="min-w-0 space-y-2">
                <MatchTeam team={fixture.home} goals={score?.home ?? null} />
                <MatchTeam team={fixture.away} goals={score?.away ?? null} />
              </div>
            </div>

            {!hasBroadcast ? (
              <p className="mt-3 type-caption text-muted-foreground sm:ml-[88px]">Transmissão ainda não confirmada</p>
            ) : null}
          </div>

          <div className="flex min-h-11 shrink-0 items-center">
            <ChevronDown className="size-5 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
          </div>
        </div>
      </summary>

      <div className="border-t border-border/55 px-4 py-4 sm:px-5">
        <div className="mb-3">
          <p className="type-caption text-muted-foreground">Detalhes do confronto</p>
        </div>
        <div className="grid gap-3 xl:grid-cols-3">
          <section aria-label="Forma recente" className="rounded-2xl border border-border/55 bg-background/20 p-4">
            <div className="flex items-center gap-2"><Activity className="size-4 text-primary" aria-hidden /><h3 className="type-label text-foreground">Momento recente</h3></div>
            <div className="mt-3 space-y-2"><TeamForm team={fixture.home} /><TeamForm team={fixture.away} /></div>
          </section>
          <section aria-label="Ratings Elo" className="rounded-2xl border border-border/55 bg-background/20 p-4">
            <div className="flex items-center gap-2"><Radio className="size-4 text-primary" aria-hidden /><h3 className="type-label text-foreground">Elo atual</h3></div>
            <div className="mt-3"><EloBlock home={fixture.home} away={fixture.away} /></div>
          </section>
          <section aria-label="Onde assistir" className="rounded-2xl border border-border/55 bg-background/20 p-4">
            <div className="flex items-center gap-2"><Tv className="size-4 text-primary" aria-hidden /><h3 className="type-label text-foreground">Onde assistir</h3></div>
            <div className="mt-3"><BroadcastList broadcasts={fixture.broadcasts} /></div>
          </section>
        </div>
      </div>
    </details>
  );
}
