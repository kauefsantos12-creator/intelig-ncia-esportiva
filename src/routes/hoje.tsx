import { createFileRoute } from "@tanstack/react-router";
import { Activity, CalendarDays, Tv, Users } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ProductPageHeader, SurfaceCard } from "@/components/ProductSurface";
import { EmptyState } from "@/components/SurfaceState";

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
          <EmptyState
            icon={CalendarDays}
            title="A agenda aparecerá aqui"
            description="Assim que os jogos do dia estiverem disponíveis, esta área mostrará horário, competição, transmissão e acesso aos detalhes de cada partida."
          />
        </SurfaceCard>

        <div className="grid gap-4 md:grid-cols-3">
          <SurfaceCard icon={Activity} title="Sports analytics" description="Elo, forma ajustada, ataque/defesa e força de calendário." tone="subtle" />
          <SurfaceCard icon={Users} title="Jogadores" description="Participação, minutagem e destaques quando a partida tiver dados disponíveis." tone="subtle" />
          <SurfaceCard icon={Tv} title="Transmissão" description="Canal ou plataforma associados à partida, com estado claro quando não houver informação." tone="subtle" />
        </div>
      </div>
    </AppShell>
  );
}
