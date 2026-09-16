import { Info } from "lucide-react";

const HELP: Record<string, string> = {
  Elo: "Rating de força relativa atualizado a partir dos resultados, levando em conta o nível dos adversários e o contexto competitivo.",
  Forma: "Resumo do desempenho recente do time, usado como contexto e não como substituto da força de longo prazo.",
  Ataque: "Leitura agregada da produção ofensiva disponível para o período e competição selecionados.",
  Defesa: "Leitura agregada da capacidade defensiva disponível para o período e competição selecionados.",
  "Força de calendário": "Contextualiza a sequência de partidas pela qualidade relativa dos adversários enfrentados e previstos.",
};

export function MetricHelp({ term }: { term: keyof typeof HELP }) {
  return (
    <details className="group relative inline-block align-middle">
      <summary
        className="touch-target ml-1 inline-flex min-h-8 min-w-8 cursor-pointer list-none items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        aria-label={`O que significa ${term}?`}
      >
        <Info className="size-3.5" aria-hidden />
      </summary>
      <div
        role="note"
        className="metric-help-popover absolute left-0 z-40 mt-1 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover p-3 text-left text-xs font-normal leading-relaxed text-popover-foreground shadow-xl"
      >
        <strong className="font-medium">{term}</strong>
        <p className="mt-1 text-muted-foreground">{HELP[term]}</p>
      </div>
    </details>
  );
}
