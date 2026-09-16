import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Home, LogOut, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

type ShellStage = "home" | "account" | string;

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

  const navClass = (active: boolean) =>
    `touch-target flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-medium transition-colors ${
      active ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    }`;

  return (
    <div className="min-h-[100dvh]" data-keyboard-open={keyboardOpen ? "true" : "false"}>
      <a href="#conteudo-principal" className="skip-link">Pular para o conteúdo principal</a>
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <Link to="/" className="touch-target flex min-h-11 min-w-0 items-center gap-2.5" aria-label="Ir para o início">
            <img src="/icons/favicon-32.png" alt="" className="size-7 shrink-0 rounded-lg ring-1 ring-primary/15 sm:size-8 sm:rounded-xl" aria-hidden />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight text-primary">INTELIGÊNCIA ESPORTIVA</span>
              <span className="hidden text-[10px] text-muted-foreground sm:block">Dados, Elo e análise esportiva</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1" aria-label="Navegação principal">
            <Link to="/" aria-current={stage === "home" ? "page" : undefined} className={navClass(stage === "home")}>
              <Home className="size-4" aria-hidden /><span className="hidden sm:inline">Início</span>
            </Link>
            <Link to="/conta" aria-current={stage === "account" ? "page" : undefined} className={navClass(stage === "account")}>
              <ShieldCheck className="size-4" aria-hidden /><span className="hidden sm:inline">Conta</span>
            </Link>
            <button type="button" onClick={() => void signOut()} className={navClass(false)} aria-label="Sair da conta">
              <LogOut className="size-4" aria-hidden /><span className="hidden sm:inline">Sair</span>
            </button>
          </nav>
        </div>
      </header>

      <main id="conteudo-principal" tabIndex={-1} className="mx-auto min-w-0 max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>

      <footer className="mx-auto max-w-[1280px] px-4 pb-8 text-xs text-muted-foreground sm:px-6 lg:px-8">
        <p>Motor de Inteligência Esportiva · Horário de Brasília · <a href="/privacidade" className="underline underline-offset-4">Privacidade</a></p>
      </footer>
    </div>
  );
}
