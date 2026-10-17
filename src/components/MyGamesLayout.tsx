import type { ReactNode } from "react";
import { ArrowDownRight } from "lucide-react";
import { JournalSection } from "@/components/JournalSection";

export function MyGamesLayout({
  games,
  lineup,
  reports,
  history,
  account,
  privacy,
}: {
  games: ReactNode;
  lineup: ReactNode;
  reports: ReactNode;
  history: ReactNode;
  account: ReactNode;
  privacy: ReactNode;
}) {
  return (
    <>
      <header className="journal-intro">
        <div>
          <p className="journal-kicker">O SEU CADERNO DE FUTEBOL</p>
          <h1>
            Futebol visto
            <br />
            <em>por você.</em>
          </h1>
        </div>
        <div className="journal-intro-note">
          <p>
            A partida termina.
            <br />A sua leitura fica.
          </p>
          <a href="#relatos" className="touch-target journal-writing-link">
            Ir ao meu relato <ArrowDownRight className="size-5" aria-hidden />
          </a>
        </div>
      </header>
      <div className="journal-section-label">
        <span>01</span> A partida
      </div>
      <div className="journal-match-layout">
        {games}
        <div className="min-w-0">{lineup}</div>
      </div>
      <section id="relatos" className="journal-reports">
        <div className="journal-section-label">
          <span>02</span> A sua leitura
        </div>
        {reports}
      </section>
      <div className="journal-archive">
        <JournalSection
          id="historico"
          title="Arquivo de anotações"
          description="Seus registros anteriores, avaliações e campinho."
        >
          {history}
        </JournalSection>
        <JournalSection
          id="conta"
          title="Sua conta"
          description="Privacidade, notificações e controles da conta."
        >
          {account}
        </JournalSection>
        <JournalSection
          id="privacidade"
          title="Aviso de Privacidade"
          description="Como seus dados são tratados e protegidos."
        >
          {privacy}
        </JournalSection>
      </div>
    </>
  );
}
