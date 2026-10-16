import { useServerFn } from "@tanstack/react-start";
import { useBlocker } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { PersonalMatchReportsView } from "@/components/PersonalMatchReportsView";
import {
  getPersonalMatchReports,
  savePersonalMatchReport,
} from "@/lib/personal-match-reports.functions";
import {
  type PersonalMatchReport,
  type PersonalMatchReportInput,
  type PersonalReportSaveResult,
} from "@/lib/personal-match-report";

export function PersonalMatchReports() {
  const load = useServerFn(getPersonalMatchReports);
  const save = useServerFn(savePersonalMatchReport);
  const [reports, setReports] = useState<PersonalMatchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [dirty, setDirty] = useState(false);
  const confirmLeave = useCallback(
    () => !window.confirm("Há alterações ainda não salvas. Deseja sair deste rascunho?"),
    [],
  );
  useBlocker({ shouldBlockFn: confirmLeave, disabled: !dirty, enableBeforeUnload: false });
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
      onDirtyChange={setDirty}
    />
  );
}
