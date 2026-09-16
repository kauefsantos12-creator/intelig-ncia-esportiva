import { createFileRoute } from "@tanstack/react-router";
import { GitCompareArrows, History, ListOrdered, TrendingUp } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { FoundationNotice, MetricPreview, ProductPageHeader, SurfaceCard } from "@/components/ProductSurface";

export const Route = createFileRoute("/elo")({
  head: () => ({
    meta: [
      { title: "Elo · Motor de Inteligência Esportiva" },
      { name: "description", content: "Rankings Elo de clubes e ligas com contexto hierárquico e histórico." },
    ],
  }),
  component: EloPage,
});

function EloPage() {
  return (
    <AppShell stage="elo">
      <div className="space-y-6">
        <ProductPageHeader
          eyebrow="Elo"
          title="Força relativa, com contexto"
          description="O Elo deixa de ser um número isolado: clube, liga, hierarquia e evolução no tempo aparecem na mesma leitura, com filtros progressivos por continente, país e competição."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <MetricPreview label="Clubes" value="Ranking" detail="Elo global e Elo local por competição." />
          <MetricPreview label="Ligas" value="Hierarquia" detail="Força relativa entre divisões e países." />
          <MetricPreview label="Histórico" value="60 dias" detail="Movimentos point-in-time sem olhar o futuro." />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <SurfaceCard icon={ListOrdered} title="Ranking de clubes" description="Continente → país → liga → clube.">
            <FoundationNotice>
              A tabela final vai consumir as leituras server-side do Elo já preservadas no backend. O ranking deve mostrar posição, Elo, variação e liga sem misturar métricas de apostas.
            </FoundationNotice>
          </SurfaceCard>

          <div className="grid gap-4">
            <SurfaceCard icon={GitCompareArrows} title="Ranking de ligas" description="Comparação hierárquica entre competições e divisões." />
            <SurfaceCard icon={History} title="Histórico" description="Trajetória de até 60 dias para clube ou liga selecionados." />
            <SurfaceCard icon={TrendingUp} title="Movimentos relevantes" description="Mudanças de Elo que merecem atenção por magnitude e contexto." />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
