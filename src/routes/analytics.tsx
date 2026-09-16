import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, CalendarRange, Layers3, UsersRound } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ProductPageHeader, SurfaceCard } from "@/components/ProductSurface";
import { EmptyState } from "@/components/SurfaceState";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics · Motor de Inteligência Esportiva" },
      { name: "description", content: "Análises por competição, time, temporada, elenco e calendário." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <AppShell stage="analytics">
      <div className="space-y-6">
        <ProductPageHeader
          eyebrow="Analytics"
          title="Do campeonato ao jogador"
          description="Explore a temporada de cima para baixo: continente, país, competição e time. Depois aprofunde desempenho, calendário, elenco e jogadores sem perder o contexto da competição."
        />

        <SurfaceCard icon={Layers3} title="Navegação analítica" description="Continente → país → competição → time.">
          <EmptyState
            icon={Layers3}
            title="Escolha do contexto analítico"
            description="Os filtros progressivos desta área vão orientar a análise sem sobrecarregar a tela com listas extensas."
          />
        </SurfaceCard>

        <div className="grid gap-4 md:grid-cols-3">
          <SurfaceCard icon={BarChart3} title="Desempenho" description="Resultados, produção ofensiva/defensiva, forma e contexto de força." tone="subtle" />
          <SurfaceCard icon={UsersRound} title="Elenco e jogadores" description="Participação, minutagem e estatísticas disponíveis por temporada." tone="subtle" />
          <SurfaceCard icon={CalendarRange} title="Calendário" description="Sequência de jogos, adversários e dificuldade relativa do período." tone="subtle" />
        </div>
      </div>
    </AppShell>
  );
}
