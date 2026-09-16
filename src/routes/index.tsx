import { createFileRoute } from "@tanstack/react-router";
import { Newspaper, TrendingUp } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ProductPageHeader, SurfaceCard } from "@/components/ProductSurface";
import { EmptyState } from "@/components/SurfaceState";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Noticiário · Motor de Inteligência Esportiva" },
      { name: "description", content: "Resenha esportiva diária, contexto e movimentos relevantes de Elo." },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  return (
    <AppShell stage="news">
      <div className="space-y-6">
        <ProductPageHeader
          eyebrow="Noticiário"
          title="O que aconteceu e o que mudou"
          description="Uma leitura diária do futebol: primeiro a resenha esportiva, depois os movimentos que realmente alteraram a fotografia de força dos times e ligas."
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
          <SurfaceCard
            icon={Newspaper}
            title="Resenha esportiva"
            description="Resultados, contexto de jogo, destaques individuais e fatos relevantes em uma leitura contínua."
            className="min-h-[22rem]"
          >
            <EmptyState
              icon={Newspaper}
              title="A resenha do período aparecerá aqui"
              description="Quando houver conteúdo disponível, esta área reunirá os principais jogos, acontecimentos e destaques em uma leitura única."
            />
          </SurfaceCard>

          <SurfaceCard
            icon={TrendingUp}
            title="Movimentos de Elo"
            description="Mudanças significativas ficam separadas do noticiário para leitura rápida."
            className="min-h-[22rem]"
          >
            <EmptyState
              icon={TrendingUp}
              title="Sem movimentos relevantes para exibir"
              description="Alterações significativas de clubes e ligas aparecerão aqui com variação e contexto."
            />
          </SurfaceCard>
        </div>
      </div>
    </AppShell>
  );
}
