import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { BackendError } from "./backend-contract";
import {
  pitchRating,
  pitchRatingInput,
  type PitchRatings,
  type PitchSaveResult,
} from "./pitch-rating";
import { row } from "./my-games";

type Response = { data: unknown; error: { code?: string } | null };
interface Query extends PromiseLike<Response> {
  select(columns: string): Query;
  eq(column: string, value: string): Query;
  limit(count: number): Query;
}
interface Db {
  from(table: string): Query;
  rpc(name: string, input: Record<string, unknown>): PromiseLike<Response>;
}
function parseRating(value: unknown) {
  const item = row(value);
  return pitchRating.parse({
    playerId: item["player_id"],
    rating: item["rating"],
    participationState: item["participation_state"],
    updatedAt: item["updated_at"],
  });
}
export const getPitchRatings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ fixtureId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<PitchRatings> => {
    if (!context.userId) throw new BackendError("UNAUTHENTICATED", "Faça login.", 401);
    const db = context.supabase as unknown as Db;
    const reviews = await db
      .from("sports_match_reviews")
      .select("id,status")
      .eq("fixture_id", data.fixtureId)
      .eq("owner_id", context.userId)
      .limit(1);
    if (reviews.error || !Array.isArray(reviews.data))
      throw new BackendError("INTERNAL_ERROR", "Não foi possível carregar suas notas.", 500);
    if (!reviews.data.length) return { reviewStatus: null, ratings: [] };
    const review = row(reviews.data[0]);
    const result = await db
      .from("sports_player_personal_ratings")
      .select("player_id,rating,participation_state,updated_at")
      .eq("review_id", z.string().uuid().parse(review["id"]))
      .limit(200);
    if (result.error || !Array.isArray(result.data))
      throw new BackendError("INTERNAL_ERROR", "Não foi possível carregar suas notas.", 500);
    return {
      reviewStatus: z.enum(["PENDING", "COMPLETED", "AUTO_CLOSED"]).parse(review["status"]),
      ratings: result.data.map(parseRating),
    };
  });
export const savePitchRating = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => pitchRatingInput.parse(input))
  .handler(async ({ data, context }): Promise<PitchSaveResult> => {
    if (!context.userId) throw new BackendError("UNAUTHENTICATED", "Faça login.", 401);
    const db = context.supabase as unknown as Db;
    const result = await db.rpc("save_pitch_player_rating", {
      p_fixture_id: data.fixtureId,
      p_player_id: data.playerId,
      p_rating: data.rating,
      p_confirmed: data.confirmed,
      p_expected_updated_at: data.expectedUpdatedAt,
    });
    if (result.error)
      return {
        ok: false,
        error:
          result.error.code === "40001"
            ? "CONFLICT"
            : result.error.code === "55000"
              ? "FINALIZED"
              : "FAILED",
      };
    if (!Array.isArray(result.data)) return { ok: false, error: "FAILED" };
    if (!result.data.length && data.rating === null)
      return {
        ok: true,
        rating: {
          playerId: data.playerId,
          rating: null,
          participationState: "UNKNOWN",
          updatedAt: null,
        },
      };
    if (!result.data.length) return { ok: false, error: "FAILED" };
    return { ok: true, rating: parseRating(result.data[0]) };
  });
