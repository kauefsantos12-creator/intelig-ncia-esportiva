import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck, Goal, NotebookPen, Star } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ProductPageHeader, SurfaceCard } from "@/components/ProductSurface";
import { EmptyState } from "@/components/SurfaceState";

export const Route = createFileRoute("/anotacoes")({
  head: () => ({
    meta: [
      { title: "Anotações · Motor de Inteligência Esportiva" },
      { name: "description", content: "Registro pessoal pós-jogo com notas, comentários e participantes." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  return (
    <AppShell stage="notes">
      <div className="space-y-6">
        <ProductPageHeader
          eyebrow="Anotações"
          title="Seu caderno de jogo"
          description="Depois do apito final, registre o que você viu: se assistiu, observações livres, notas pessoais, leitura tática e participantes que chamaram atenção."
        />

        <SurfaceCard icon={ClipboardCheck} title="Jogos disponíveis para anotar" description="Somente partidas encerradas entram nesta fila.">
          <EmptyState
            icon={ClipboardCheck}
            title="Nenhuma partida disponível para anotar"
            description="Quando houver jogos encerrados elegíveis, eles aparecerão aqui para iniciar ou continuar seu registro pessoal."
          />
        </SurfaceCard>

        <div className="grid gap-4 lg:grid-cols-3">
          <SurfaceCard icon={NotebookPen} title="1. Registro" description="Assistiu ou não assistiu, comentário e impressão geral." tone="subtle" />
          <SurfaceCard icon={Star} title="2. Notas pessoais" description="Escala de 0 a 10 em passos de 0,5 para jogadores ou aspectos escolhidos." tone="subtle" />
          <SurfaceCard icon={Goal} title="3. Campinho" description="Marcação visual de participantes e zonas para complementar a leitura do jogo." tone="subtle" />
        </div>
      </div>
    </AppShell>
  );
}
