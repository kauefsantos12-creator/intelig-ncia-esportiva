import { z } from "zod";

export const personalMatchReportInput = z
  .object({
    id: z.string().uuid(),
    version: z.number().int().min(0).max(2_000_000_000),
    homeTeam: z.string().trim().min(1, "Informe o mandante.").max(120),
    awayTeam: z.string().trim().min(1, "Informe o visitante.").max(120),
    competition: z.string().trim().max(180).nullable(),
    kickoffAt: z.string().datetime({ offset: true }),
    notes: z.string().max(4000, "O relato pode ter até 4.000 caracteres."),
  })
  .strict();

export const personalMatchReport = personalMatchReportInput.extend({
  version: z.number().int().positive(),
  updatedAt: z.string().datetime({ offset: true }),
});

export type PersonalMatchReportInput = z.infer<typeof personalMatchReportInput>;
export type PersonalMatchReport = z.infer<typeof personalMatchReport>;
export type PersonalReportSaveResult =
  { ok: true; report: PersonalMatchReport } | { ok: false; error: "CONFLICT" | "UNAVAILABLE" };

const brazilDateTime = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function toBrazilDateTimeInput(value: string | Date): string {
  const parts = Object.fromEntries(
    brazilDateTime.formatToParts(new Date(value)).map((part) => [part.type, part.value]),
  );
  return `${parts["year"]}-${parts["month"]}-${parts["day"]}T${parts["hour"]}:${parts["minute"]}`;
}

// Resolve the wall clock in São Paulo without using the device's timezone.
export function fromBrazilDateTimeInput(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new Error("Informe data e horário válidos.");
  const wall = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(wall)) throw new Error("Informe data e horário válidos.");
  let instant = wall;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const shown = toBrazilDateTimeInput(new Date(instant));
    instant += wall - Date.parse(`${shown}:00Z`);
  }
  if (toBrazilDateTimeInput(new Date(instant)) !== value)
    throw new Error("Informe data e horário válidos.");
  return new Date(instant).toISOString();
}
