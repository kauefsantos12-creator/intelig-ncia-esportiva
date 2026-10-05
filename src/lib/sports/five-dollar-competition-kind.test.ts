import { describe, expect, it } from "vitest";

import { inferCompetitionKind } from "./five-dollar-sports-sync.server";

describe("FiveDollar competition classification", () => {
  it.each(["Spain Segunda", "Argentina Nacional B", "Scotland Championship"])(
    "keeps registered domestic target %s in the league scope",
    (name) => expect(inferCompetitionKind(name, false, true)).toBe("LEAGUE"),
  );

  it("does not mistake Championship for Champions League", () => {
    expect(inferCompetitionKind("USA USL Championship", false)).toBe("LEAGUE");
    expect(inferCompetitionKind("UEFA Champions League", false)).toBe("CONTINENTAL");
  });

  it("preserves registered continental targets and cup classification", () => {
    expect(inferCompetitionKind("Unknown tournament", true)).toBe("CONTINENTAL");
    expect(inferCompetitionKind("Coppa Italia", false)).toBe("CUP");
    expect(inferCompetitionKind("International Match", false)).toBe("OTHER");
  });
});
