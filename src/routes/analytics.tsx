import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, CalendarRange, Layers3, UsersRound } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { FoundationNotice, ProductPageHeader, SurfaceCard } from "@/components/ProductSurface";

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
          <FoundationNotice>
            Os filtros serão progressivos para evitar listas enormes no celular. A seleção de uma competição define o contexto dos indicadores exibidos abaixo.
          </FoundationNotice>
        </SurfaceCard>

        <div className="grid gap-4 md:grid-cols-3">
          <SurfaceCard icon={BarChart3} title="Desempenho" description="Resultados, produção ofensiva/defensiva, forma e contexto de força." />
          <SurfaceCard icon={UsersRound} title="Elenco e jogadores" description="Participação, minutagem e estatísticas disponíveis por temporada." />
          <SurfaceCard icon={CalendarRange} title="Calendário" description="Sequência de jogos, adversários e dificuldade relativa do período." />
        </div>
      </div>
    </AppShell>
  );
}
