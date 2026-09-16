import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

const retiredRuntime = [
  "src/routes/open-bets.tsx",
  "src/routes/api.analysis-worker.ts",
  "src/routes/api.model-validation.ts",
  "src/routes/run.$runId.oportunidades.tsx",
  "src/lib/authorization.server.ts",
  "src/lib/bankroll.functions.ts",
  "src/lib/decision-queue.functions.ts",
  "src/lib/pipeline.server.ts",
  "src/lib/application/training/stage9-1x2-ensemble-calibration.ts",
];

const retainedSportsFoundation = [
  "src/lib/sports/five-dollar-sports-sync.server.ts",
  "src/lib/sports/api-football-sports-sync.server.ts",
  "src/lib/engine/elo.ts",
  "src/lib/elo-sync.server.ts",
  "src/routes/api.elo-sync.ts",
];

describe("sports intelligence runtime boundary", () => {
  it("keeps retired betting runtime out of the executable tree", () => {
    for (const path of retiredRuntime) expect(existsSync(path), path).toBe(false);
  });

  it("preserves sports providers and Elo foundation", () => {
    for (const path of retainedSportsFoundation) expect(existsSync(path), path).toBe(true);
  });
});
