import { useServerFn } from "@tanstack/react-start";
import { NotebookPen, Plus, Save } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { SurfaceCard } from "@/components/ProductSurface";
import {
  getPersonalMatchReports,
  savePersonalMatchReport,
} from "@/lib/personal-match-reports.functions";
import {
  fromBrazilDateTimeInput,
  personalMatchReportInput,
  toBrazilDateTimeInput,
  type PersonalMatchReport,
  type PersonalMatchReportInput,
  type PersonalReportSaveResult,
} from "@/lib/personal-match-report";

type Draft = Omit<PersonalMatchReportInput, "kickoffAt"> & { localKickoff: string };
const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
const fieldClass =
  "mt-1 min-h-11 w-full rounded-xl border border-border/70 bg-secondary/25 px-3 py-2 type-meta text-foreground outline-none focus:border-primary disabled:opacity-60";

function emptyDraft(): Draft {
  return {
    id: crypto.randomUUID(),
    version: 0,
    homeTeam: "",
    awayTeam: "",
    competition: "",
    notes: "",
    localKickoff: `${toBrazilDateTimeInput(new Date()).slice(0, 10)}T20:00`,
  };
}
function toDraft(report: PersonalMatchReport): Draft {
  return {
    id: report.id,
    version: report.version,
    homeTeam: report.homeTeam,
    awayTeam: report.awayTeam,
    competition: report.competition,
    notes: report.notes,
    localKickoff: toBrazilDateTimeInput(report.kickoffAt),
  };
}

export function PersonalMatchReports() {
  const load = useServerFn(getPersonalMatchReports);
  const save = useServerFn(savePersonalMatchReport);
  const [reports, setReports] = useState<PersonalMatchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setReports(await load());
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [load]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  async function persist(data: PersonalMatchReportInput): Promise<PersonalReportSaveResult> {
    const result = await save({ data });
    if (result.ok)
      setReports((current) =>
        [result.report, ...current.filter((report) => report.id !== result.report.id)].slice(
          0,
          100,
        ),
      );
    return result;
  }
  return (
    <PersonalMatchReportsView
      reports={reports}
      loading={loading}
      loadError={loadError}
      onReload={() => void refresh()}
      onSave={persist}
    />
  );
}

export function PersonalMatchReportsView({
  reports,
  onSave,
  loading = false,
  loadError = false,
  onReload,
}: {
  reports: PersonalMatchReport[];
  onSave: (input: PersonalMatchReportInput) => Promise<PersonalReportSaveResult>;
  loading?: boolean;
  loadError?: boolean;
  onReload?: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const baseline = useRef(JSON.stringify(draft));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dirty = baseline.current !== JSON.stringify(draft);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function choose(next: Draft) {
    if (dirty && !window.confirm("Há alterações ainda não salvas. Deseja sair deste rascunho?"))
      return;
    baseline.current = JSON.stringify(next);
    setDraft(next);
    setError(null);
    setMessage(null);
  }
  function change<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage(null);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    let input: PersonalMatchReportInput;
    try {
      const { localKickoff, ...rest } = draft;
      input = personalMatchReportInput.parse({
        ...rest,
        competition: rest.competition || null,
        kickoffAt: fromBrazilDateTimeInput(localKickoff),
      });
    } catch {
      setError("Confira os times, a data, o horário e o limite de 4.000 caracteres.");
      return;
    }
    setSaving(true);
    try {
      const result = await onSave(input);
      if (!result.ok) {
        setError(
          result.error === "CONFLICT"
            ? "Este relato foi alterado em outra sessão. Seu texto continua aqui: copie-o antes de atualizar e comparar as versões."
            : "Não foi possível salvar. Seu texto continua neste formulário; tente novamente.",
        );
        return;
      }
      const next = toDraft(result.report);
      baseline.current = JSON.stringify(next);
      setDraft(next);
      setMessage(
        `Relato salvo. Última gravação: ${dateFormat.format(new Date(result.report.updatedAt))}, horário de Brasília.`,
      );
    } catch {
      setError(
        "Não foi possível confirmar o salvamento. Seu texto continua aqui; tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SurfaceCard
      icon={NotebookPen}
      title="Relatos pessoais"
      description="Comece antes ou durante o jogo e continue depois. Os dados desta partida são informados por você."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.4fr)]">
        <div className="min-w-0 space-y-3">
          <button
            type="button"
            onClick={() => choose(emptyDraft())}
            disabled={saving}
            className="touch-target inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/50 px-4 py-2 type-meta font-semibold text-primary disabled:opacity-50"
          >
            <Plus className="size-4" aria-hidden />
            Novo relato
          </button>
          <p className="type-caption text-muted-foreground">
            Últimos 100 relatos salvos na sua conta.
          </p>
          {loading ? (
            <p role="status" className="type-meta text-muted-foreground">
              Carregando seus relatos…
            </p>
          ) : null}
          {loadError ? (
            <div role="alert" className="space-y-2 type-meta text-destructive">
              <p>Não foi possível carregar os relatos salvos.</p>
              <button
                type="button"
                onClick={onReload}
                disabled={saving || loading}
                className="touch-target min-h-11 underline"
              >
                Tentar carregar novamente
              </button>
            </div>
          ) : null}
          {!loading && !loadError && reports.length === 0 ? (
            <p className="type-meta text-muted-foreground">
              Seu primeiro relato pode começar agora. Preencha a partida ao lado.
            </p>
          ) : null}
          <div
            className="max-h-96 space-y-2 overflow-y-auto"
            role="group"
            aria-label="Relatos salvos"
          >
            {reports.map((report) => (
              <button
                key={report.id}
                type="button"
                disabled={saving}
                aria-pressed={draft.id === report.id}
                onClick={() => choose(toDraft(report))}
                className="touch-target w-full rounded-xl border border-border/60 bg-secondary/20 px-3 py-3 text-left aria-pressed:border-primary disabled:opacity-50"
              >
                <span className="block break-words type-label">
                  {report.homeTeam} × {report.awayTeam}
                </span>
                <span className="mt-1 block type-caption text-muted-foreground">
                  {dateFormat.format(new Date(report.kickoffAt))} · Brasília
                </span>
              </button>
            ))}
          </div>
        </div>
        <form
          onSubmit={(event) => void submit(event)}
          className="min-w-0 space-y-4"
          aria-label="Relato da partida"
        >
          <fieldset disabled={saving} className="space-y-4">
            <legend className="sr-only">Partida e suas observações</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="type-meta font-medium">
                Mandante
                <input
                  value={draft.homeTeam}
                  onChange={(event) => change("homeTeam", event.target.value)}
                  maxLength={120}
                  required
                  className={fieldClass}
                  autoComplete="off"
                />
              </label>
              <label className="type-meta font-medium">
                Visitante
                <input
                  value={draft.awayTeam}
                  onChange={(event) => change("awayTeam", event.target.value)}
                  maxLength={120}
                  required
                  className={fieldClass}
                  autoComplete="off"
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="type-meta font-medium">
                Data e hora de Brasília
                <input
                  type="datetime-local"
                  value={draft.localKickoff}
                  onChange={(event) => change("localKickoff", event.target.value)}
                  required
                  className={fieldClass}
                />
              </label>
              <label className="type-meta font-medium">
                Competição (opcional)
                <input
                  value={draft.competition ?? ""}
                  onChange={(event) => change("competition", event.target.value)}
                  maxLength={180}
                  className={fieldClass}
                  autoComplete="off"
                />
              </label>
            </div>
            <label className="block type-meta font-medium">
              Seu relato
              <textarea
                value={draft.notes}
                onChange={(event) => change("notes", event.target.value)}
                maxLength={4000}
                rows={9}
                className={fieldClass}
                placeholder="Suas impressões, lances e observações ao longo da partida."
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="type-caption text-muted-foreground">
                {draft.notes.length}/4.000 caracteres ·{" "}
                {dirty
                  ? "Alterações ainda não salvas"
                  : draft.version
                    ? "Versão salva carregada"
                    : "Novo rascunho"}
              </span>
              <button
                type="submit"
                disabled={saving}
                className="touch-target inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 type-meta font-semibold text-primary-foreground disabled:opacity-50"
              >
                <Save className="size-4" aria-hidden />
                {saving ? "Salvando…" : "Salvar relato"}
              </button>
            </div>
          </fieldset>
          <p className="type-caption text-muted-foreground">
            Use Salvar relato para guardar na sua conta. Você pode reabrir e editar depois.
          </p>
          {message ? (
            <p role="status" aria-live="polite" className="type-meta text-success">
              {message}
            </p>
          ) : null}
          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 p-3 type-meta text-destructive"
            >
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </SurfaceCard>
  );
}
