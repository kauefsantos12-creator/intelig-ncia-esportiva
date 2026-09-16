import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("Anotações sports intelligence contract", () => {
  it("loads and mutates personal reviews only through authenticated server functions", () => {
    const server = source("./lib/notes-overview.functions.ts");
    expect(server).toContain("requireSupabaseAuth");
    expect(server).toContain("await adminDb()");
    expect(server).toContain("enqueue_finished_sports_reviews");
    expect(server).toContain("requireOwnedReview");
  });

  it("uses canonical review, participant and field-mark stores", () => {
    const server = source("./lib/notes-overview.functions.ts");
    expect(server).toContain('from("sports_match_reviews")');
    expect(server).toContain('from("sports_fixture_player_stats")');
    expect(server).toContain('from("sports_player_personal_ratings")');
    expect(server).toContain('from("sports_review_field_marks")');
  });

  it("keeps personal ratings on the governed 0.5 step and participant-only rule", () => {
    const server = source("./lib/notes-overview.functions.ts");
    expect(server).toContain("multipleOf(0.5)");
    expect(server).toContain('data.participationState !== "PARTICIPATED"');
    expect(server).toContain("providerRatingSnapshot");
  });

  it("renders the complete post-match workflow instead of a placeholder", () => {
    const route = source("./routes/anotacoes.tsx");
    expect(route).toContain("getNotesOverview");
    expect(route).toContain("Você assistiu à partida?");
    expect(route).toContain("Notas pessoais");
    expect(route).toContain("Campinho");
    expect(route).toContain("Finalizar anotação");
    expect(route).toContain("Adicionar marcação no campinho");
  });

  it("keeps loading, error, retry and empty states explicit", () => {
    const route = source("./routes/anotacoes.tsx");
    expect(route).toContain("<LoadingState");
    expect(route).toContain("<ErrorState");
    expect(route).toContain("<EmptyState");
    expect(route).toContain("Atualizar fila");
  });
});
