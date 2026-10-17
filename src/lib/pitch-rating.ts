import { z } from "zod";
export const pitchRatingInput = z
  .object({
    fixtureId: z.string().uuid(),
    playerId: z.string().uuid(),
    rating: z.number().finite().min(0).max(10).multipleOf(0.5).nullable(),
    confirmed: z.boolean(),
    expectedUpdatedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .refine((value) => value.rating === null || value.confirmed, "Confirme que viu o jogador atuar.");
export type PitchRatingInput = z.infer<typeof pitchRatingInput>;
export const pitchRating = z.object({
  playerId: z.string(),
  rating: z.number().min(0).max(10).multipleOf(0.5).nullable(),
  participationState: z.enum(["PARTICIPATED", "DID_NOT_PLAY", "UNKNOWN"]),
  updatedAt: z.string().nullable(),
});
export type PitchRating = z.infer<typeof pitchRating>;
export type PitchRatings = {
  reviewStatus: "PENDING" | "COMPLETED" | "AUTO_CLOSED" | null;
  ratings: PitchRating[];
};
export type PitchSaveResult =
  { ok: true; rating: PitchRating } | { ok: false; error: "CONFLICT" | "FINALIZED" | "FAILED" };
export function ratingLabel(value: number | null) {
  return value === null ? "—" : value.toFixed(1).replace(".", ",");
}
