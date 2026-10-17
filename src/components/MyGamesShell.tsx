import type { ReactNode } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { revealJournalSection } from "@/components/JournalSection";

export function MyGamesShell({
  children,
  onSignOut,
}: {
  children: ReactNode;
  onSignOut?: () => void | Promise<void>;
}) {
  return (
    <div className="app-shell journal-app min-h-[100dvh]" data-stage="notes">
      <a href="#conteudo-principal" className="skip-link">
        Pular para o conteúdo principal
      </a>
      <header className="journal-header">
        <div className="journal-header-inner">
          <a
            href="#conteudo-principal"
            className="touch-target flex min-h-11 min-w-0 items-center gap-3"
            aria-label="Meus Jogos — início"
          >
            <img src="/brand/meus-jogos.svg" alt="" width="44" height="44" aria-hidden />
            <span className="min-w-0">
              <span className="journal-wordmark">
                meus jogos<span aria-hidden>.</span>
              </span>
              <span className="journal-tagline">Seu caderno de futebol</span>
            </span>
          </a>
          <div className="journal-utilities">
            <a
              href="#conta"
              onClick={() => revealJournalSection("conta")}
              className="touch-target journal-utility"
              aria-label="Conta e privacidade"
            >
              <ShieldCheck className="size-4" aria-hidden />
              <span className="hidden sm:inline">Sua conta</span>
            </a>
            {onSignOut ? (
              <button
                type="button"
                className="touch-target journal-utility"
                onClick={() => void onSignOut()}
                aria-label="Sair da conta"
              >
                <LogOut className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
      </header>
      <main id="conteudo-principal" tabIndex={-1} className="journal-main">
        {children}
      </main>
      <footer className="journal-footer">
        <p>
          <strong>meus jogos.</strong> Futebol visto por você.
        </p>
        <div>
          <span>Horário de Brasília</span>
          <a
            href="#privacidade"
            onClick={() => revealJournalSection("privacidade")}
            className="touch-target underline underline-offset-4"
          >
            Privacidade
          </a>
        </div>
      </footer>
    </div>
  );
}
