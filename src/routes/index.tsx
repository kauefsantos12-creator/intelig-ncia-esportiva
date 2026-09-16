import { createFileRoute } from "@tanstack/react-router";
import { Database, ShieldCheck, TrendingUp } from "lucide-react";

import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Motor de Inteligência Esportiva" },
      { name: "description", content: "Base privada para dados, Elo e inteligência esportiva." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <AppShell stage="home">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="panel p-6 sm:p-8">
          <p className="label-eyebrow">Transição de arquitetura</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Motor de Inteligência Esportiva</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            O runtime legado de apostas foi retirado. Esta branch mantém a fundação esportiva canônica, o Elo, a autenticação e a governança enquanto as novas superfícies do produto são construídas separadamente.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3" aria-label="Fundações preservadas">
          <article className="panel p-5">
            <Database className="size-5 text-primary" aria-hidden />
            <h2 className="mt-3 font-semibold">Dados esportivos</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Catálogo canônico de competições, times, partidas, estatísticas, jogadores e transmissões.</p>
          </article>
          <article className="panel p-5">
            <TrendingUp className="size-5 text-primary" aria-hidden />
            <h2 className="mt-3 font-semibold">Elo preservado</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">O núcleo hierárquico de Elo permanece isolado para a próxima etapa de auditoria.</p>
          </article>
          <article className="panel p-5">
            <ShieldCheck className="size-5 text-primary" aria-hidden />
            <h2 className="mt-3 font-semibold">Acesso privado</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Autenticação, RLS, privacidade e governança continuam como limites obrigatórios do produto.</p>
          </article>
        </section>
      </div>
    </AppShell>
  );
}
