import { createFileRoute } from "@tanstack/react-router";
import { Activity, CalendarDays, ChevronDown, Tv, Users } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { FoundationNotice, ProductPageHeader, SurfaceCard } from "@/components/ProductSurface";

export const Route = createFileRoute("/hoje")({
  head: () => ({
    meta: [
      { title: "Hoje · Motor de Inteligência Esportiva" },
      { name: "description", content: "Jogos do dia, transmissões e contexto esportivo antes e depois da partida." },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  return (
    <AppShell stage="today">
      <div className="space-y-6">
        <ProductPageHeader
          eyebrow="Hoje"
          title="Os jogos do dia, sem ruído"
          description="A agenda concentra partidas transmitidas e abre o contexto de cada jogo sob demanda: transmissão, forma, Elo, força de calendário, desempenho e jogadores."
        />

        <SurfaceCard
          icon={CalendarDays}
          title="Agenda do dia"
          description="Uma linha por partida; detalhes aparecem apenas quando você quiser aprofundar."
        >
          <FoundationNotice>
            A estrutura final desta lista será alimentada pelas fixtures canônicas e pela camada de transmissões. O comportamento expansível já é a referência de UX para esta tela.
          </FoundationNotice>

          <div className="mt-5 overflow-hidden rounded-2xl border border-border/70">
            <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3 bg-secondary/35 px-4 py-3 sm:grid-cols-[5rem_minmax(0,1fr)_12rem_auto]">
              <span className="type-metric text-foreground">20:30</span>
              <div className="min-w-0">
                <p className="type-label truncate text-foreground">Mandante × Visitante</p>
                <p className="type-caption truncate text-muted-foreground">Competição · rodada</p>
              </div>
              <div className="hidden items-center gap-2 text-muted-foreground sm:flex">
                <Tv className="size-4" aria-hidden />
                <span className="type-caption">Onde assistir</span>
              </div>
              <button type="button" className="touch-target flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted-foreground" aria-label="Expandir detalhes do jogo" disabled>
                <ChevronDown className="size-5" aria-hidden />
              </button>
            </div>
          </div>
        </SurfaceCard>

        <div className="grid gap-4 md:grid-cols-3">
          <SurfaceCard icon={Activity} title="Sports analytics" description="Elo, forma ajustada, ataque/defesa e força de calendário." />
          <SurfaceCard icon={Users} title="Jogadores" description="Participação, minutagem e destaques quando a partida tiver dados disponíveis." />
          <SurfaceCard icon={Tv} title="Transmissão" description="Canal ou plataforma associados à fixture canônica, com fallback claro quando não houver informação." />
        </div>
      </div>
    </AppShell>
  );
}
