import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck, Goal, NotebookPen, Star } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { FoundationNotice, ProductPageHeader, SurfaceCard } from "@/components/ProductSurface";

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
          <FoundationNotice>
            A seleção será derivada das fixtures finalizadas. Cada anotação ficará vinculada à partida canônica e ao seu usuário, sem depender de armazenamento local.
          </FoundationNotice>
        </SurfaceCard>

        <div className="grid gap-4 lg:grid-cols-3">
          <SurfaceCard icon={NotebookPen} title="1. Registro" description="Assistiu ou não assistiu, comentário e impressão geral." />
          <SurfaceCard icon={Star} title="2. Notas pessoais" description="Escala de 0 a 10 em passos de 0,5 para jogadores ou aspectos escolhidos." />
          <SurfaceCard icon={Goal} title="3. Campinho" description="Marcação visual de participantes e zonas para complementar a leitura do jogo." />
        </div>
      </div>
    </AppShell>
  );
}
