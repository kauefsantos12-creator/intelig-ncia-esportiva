import { createFileRoute } from "@tanstack/react-router";
import { Newspaper, Sparkles, TrendingUp } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { FoundationNotice, ProductPageHeader, SurfaceCard } from "@/components/ProductSurface";

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
            <FoundationNotice>
              Esta superfície já está preparada para receber a resenha factual combinando dados estruturados do runtime esportivo com contexto editorial. Nenhum dado de apostas será exibido aqui.
            </FoundationNotice>
            <div className="mt-5 space-y-3" aria-label="Estrutura da resenha">
              {[
                "Panorama do dia e partidas de maior relevância",
                "Resumo por jogo com fatos e melhores momentos",
                "Destaques individuais sustentados por dados da partida",
                "Competições menores agrupadas para reduzir ruído",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl bg-secondary/35 px-4 py-3">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <p className="type-meta text-foreground/90">{item}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard
            icon={TrendingUp}
            title="Movimentos de Elo"
            description="Mudanças significativas ficam separadas do noticiário para leitura rápida."
            className="min-h-[22rem]"
          >
            <FoundationNotice>
              A próxima conexão desta área usará o histórico point-in-time já preservado no backend para destacar variações relevantes de clubes e ligas.
            </FoundationNotice>
            <div className="mt-5 grid gap-3">
              <div className="metric-tile p-4">
                <p className="type-label text-foreground">Clube</p>
                <p className="mt-1 type-caption text-muted-foreground">Variação recente, posição e contexto da mudança.</p>
              </div>
              <div className="metric-tile p-4">
                <p className="type-label text-foreground">Liga</p>
                <p className="mt-1 type-caption text-muted-foreground">Movimento hierárquico e diferença para ligas relacionadas.</p>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </AppShell>
  );
}
