// Dev-server fixture only. No auth bypass, production route or real database.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { PersonalMatchReportsView } from "@/components/PersonalMatchReportsView";
import {
  type PersonalMatchReport,
  type PersonalMatchReportInput,
  type PersonalReportSaveResult,
} from "@/lib/personal-match-report";
import "@/styles.css";

declare global {
  interface Window {
    reportFailure?: "CONFLICT" | "NETWORK";
  }
}
const key = "test-personal-match-reports";
function Fixture() {
  const [reports, setReports] = useState<PersonalMatchReport[]>(
    () => JSON.parse(sessionStorage.getItem(key) ?? "[]") as PersonalMatchReport[],
  );
  async function save(input: PersonalMatchReportInput): Promise<PersonalReportSaveResult> {
    if (window.reportFailure === "NETWORK") throw new Error("Simulated unavailable transport");
    if (window.reportFailure === "CONFLICT") return { ok: false, error: "CONFLICT" };
    const report = { ...input, version: input.version + 1, updatedAt: new Date().toISOString() };
    const next = [report, ...reports.filter((item) => item.id !== report.id)];
    sessionStorage.setItem(key, JSON.stringify(next));
    setReports(next);
    return { ok: true, report };
  }
  return (
    <main className="min-h-screen p-3 sm:p-6">
      <h1 className="mb-4 type-section-title">Teste do editor com dados fictícios</h1>
      <PersonalMatchReportsView reports={reports} onSave={save} />
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
