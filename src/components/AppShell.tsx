import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarDays,
  LogOut,
  Newspaper,
  NotebookPen,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

type ShellStage = "news" | "today" | "elo" | "analytics" | "notes" | "account" | string;

type ProductNavItem = {
  stage: ShellStage;
  to: "/" | "/hoje" | "/elo" | "/analytics" | "/anotacoes";
  label: string;
  icon: LucideIcon;
};

const PRODUCT_NAV: ProductNavItem[] = [
  { stage: "news", to: "/", label: "Noticiário", icon: Newspaper },
  { stage: "today", to: "/hoje", label: "Hoje", icon: CalendarDays },
  { stage: "elo", to: "/elo", label: "Elo", icon: TrendingUp },
  { stage: "analytics", to: "/analytics", label: "Analytics", icon: BarChart3 },
  { stage: "notes", to: "/anotacoes", label: "Anotações", icon: NotebookPen },
];

export function AppShell({ stage, children }: { stage: ShellStage; children: ReactNode }) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      const coveredHeight = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardOpen(coveredHeight > 120);
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  const utilityNavClass = (active: boolean) =>
    `touch-target flex min-h-11 min-w-11 items-center justify-center rounded-2xl transition-all ${
      active ? "bg-[var(--stage-soft)] text-[var(--stage-accent-strong)] shadow-sm" : "text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm"
    }`;

  return (
    <div className="app-shell min-h-[100dvh]" data-stage={stage} data-keyboard-open={keyboardOpen ? "true" : "false"}>
      <a href="#conteudo-principal" className="skip-link">Pular para o conteúdo principal</a>

      <header className="app-shell-header sticky top-0 z-30 border-b pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <Link to="/" className="touch-target flex min-h-11 min-w-0 shrink-0 items-center gap-2.5" aria-label="Ir para o Noticiário">
            <img src="/icons/favicon-32.png" alt="" className="product-brand-mark size-9 shrink-0 rounded-2xl ring-1 ring-border/70" aria-hidden />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight text-foreground">INTELIGÊNCIA ESPORTIVA</span>
              <span className="hidden text-xs text-muted-foreground xl:block">Futebol, Elo e leitura de jogo</span>
            </span>
          </Link>

          <nav className="product-nav-shell ml-auto hidden min-w-0 items-center justify-center gap-1 rounded-2xl p-1 lg:flex" aria-label="Navegação principal">
            {PRODUCT_NAV.map((item) => {
              const Icon = item.icon;
              const active = stage === item.stage;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  data-active={active ? "true" : "false"}
                  className="product-nav-link touch-target inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium"
                >
                  <Icon className="size-4" aria-hidden />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1 lg:ml-2">
            <Link to="/conta" aria-current={stage === "account" ? "page" : undefined} className={utilityNavClass(stage === "account")} aria-label="Conta">
              <ShieldCheck className="size-4" aria-hidden />
            </Link>
            <button type="button" onClick={() => void signOut()} className={utilityNavClass(false)} aria-label="Sair da conta">
              <LogOut className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <main id="conteudo-principal" tabIndex={-1} className="mx-auto min-w-0 max-w-[1440px] px-4 py-6 pb-28 sm:px-6 sm:py-8 sm:pb-28 lg:px-8 lg:pb-10">
        {children}
      </main>

      <footer className="mx-auto hidden max-w-[1440px] px-4 pb-8 text-xs text-muted-foreground lg:block sm:px-6 lg:px-8">
        <p>Motor de Inteligência Esportiva · Horário de Brasília · <a href="/privacidade" className="underline underline-offset-4">Privacidade</a></p>
      </footer>

      {!keyboardOpen ? (
        <nav className="product-mobile-nav fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden" aria-label="Navegação principal">
          <div className="mx-auto grid max-w-xl grid-cols-5 gap-1 px-2 py-2">
            {PRODUCT_NAV.map((item) => {
              const Icon = item.icon;
              const active = stage === item.stage;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  data-active={active ? "true" : "false"}
                  className="product-nav-link touch-target flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-xs font-medium"
                >
                  <Icon className="size-5" aria-hidden />
                  <span className="max-w-full truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
