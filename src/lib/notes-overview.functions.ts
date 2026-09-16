import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { adminDb } from "./admin-db";
import { BackendError } from "./backend-contract";

type DbError = { message: string } | null;
type DbResponse = { data: unknown; error: DbError };

interface NotesQuery extends PromiseLike<DbResponse> {
  select(columns?: string): NotesQuery;
  eq(column: string, value: unknown): NotesQuery;
  in(column: string, values: readonly unknown[]): NotesQuery;
  order(column: string, options?: Record<string, unknown>): NotesQuery;
  limit(value: number): NotesQuery;
  maybeSingle(): NotesQuery;
  insert(values: unknown): NotesQuery;
  update(values: unknown): NotesQuery;
  upsert(values: unknown, options?: Record<string, unknown>): NotesQuery;
  delete(): NotesQuery;
}

interface NotesDb {
  from(table: string): NotesQuery;
  rpc(name: string, params?: Record<string, unknown>): PromiseLike<DbResponse>;
}

export type NotesQueueItem = {
  reviewId: string;
  fixtureId: string;
  kickoffAt: string;
  status: "PENDING" | "COMPLETED" | "AUTO_CLOSED";
  watched: boolean | null;
  notes: string | null;
  finalizedAt: string | null;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number | null;
  awayGoals: number | null;
};

export type NotesPlayer = {
  playerId: string;
  name: string;
  teamId: string;
  teamName: string;
  participationState: "PARTICIPATED" | "DID_NOT_PLAY" | "UNKNOWN";
  minutes: number | null;
  providerRating: number | null;
  personalRating: number | null;
  personalNotes: string | null;
};

export type FieldMark = {
  id: string;
  playerId: string | null;
  playerName: string | null;
  xPercent: number;
  yPercent: number;
  note: string | null;
};

export type NotesReviewDetail = {
  review: NotesQueueItem;
  players: NotesPlayer[];
  fieldMarks: FieldMark[];
};

export type NotesOverview = {
  observedAt: string;
  queue: NotesQueueItem[];
};

const reviewIdSchema = z.object({ reviewId: z.string().uuid() });
const saveReviewSchema = z.object({
  reviewId: z.string().uuid(),
  watched: z.boolean().nullable(),
  notes: z.string().max(4000).nullable(),
});
const playerRatingSchema = z.object({
  reviewId: z.string().uuid(),
  playerId: z.string().uuid(),
  participationState: z.enum(["PARTICIPATED", "DID_NOT_PLAY", "UNKNOWN"]),
  rating: z.number().min(0).max(10).multipleOf(0.5).nullable(),
  notes: z.string().max(1000).nullable(),
  providerRatingSnapshot: z.number().min(0).max(10).nullable(),
});
const fieldMarkSchema = z.object({
  reviewId: z.string().uuid(),
  playerId: z.string().uuid().nullable(),
  xPercent: z.number().min(0).max(100),
  yPercent: z.number().min(0).max(100),
  note: z.string().max(500).nullable(),
});
const deleteFieldMarkSchema = z.object({
  reviewId: z.string().uuid(),
  markId: z.string().uuid(),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function relation(value: unknown): Record<string, unknown> | null {
  if (isRecord(value)) return value;
  if (Array.isArray(value) && isRecord(value[0])) return value[0];
  return null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function numeric(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function parseStatus(value: unknown): NotesQueueItem["status"] {
  return value === "COMPLETED" || value === "AUTO_CLOSED" ? value : "PENDING";
}

function parseQueueItem(row: Record<string, unknown>): NotesQueueItem | null {
  const fixture = relation(row["fixture"]);
  const competition = fixture ? relation(fixture["competition"]) : null;
  const home = fixture ? relation(fixture["home_team"]) : null;
  const away = fixture ? relation(fixture["away_team"]) : null;
  const reviewId = text(row["id"]);
  const fixtureId = fixture ? text(fixture["id"]) : null;
  const kickoffAt = fixture ? text(fixture["kickoff_at"]) : null;
  const competitionName = competition ? text(competition["name"]) : null;
  const homeTeam = home ? text(home["name"]) : null;
  const awayTeam = away ? text(away["name"]) : null;
  if (!reviewId || !fixtureId || !kickoffAt || !competitionName || !homeTeam || !awayTeam) return null;

  return {
    reviewId,
    fixtureId,
    kickoffAt,
    status: parseStatus(row["status"]),
    watched: booleanOrNull(row["watched"]),
    notes: text(row["notes"]),
    finalizedAt: text(row["finalized_at"]),
    competition: competitionName,
    homeTeam,
    awayTeam,
    homeGoals: fixture ? numeric(fixture["home_goals"]) : null,
    awayGoals: fixture ? numeric(fixture["away_goals"]) : null,
  };
}

async function requireOwnedReview(db: NotesDb, ownerId: string, reviewId: string) {
  const result = await db
    .from("sports_match_reviews")
    .select("id")
    .eq("id", reviewId)
    .eq("owner_id", ownerId)
    .limit(1)
    .maybeSingle();
  if (result.error || !isRecord(result.data) || !text(result.data["id"])) {
    throw new BackendError("NOT_FOUND", "Anotação não encontrada.", 404);
  }
}

async function loadQueue(db: NotesDb, ownerId: string): Promise<NotesQueueItem[]> {
  const result = await db
    .from("sports_match_reviews")
    .select(
      "id,fixture_id,watched,notes,status,finalized_at,created_at,fixture:sports_fixtures!sports_match_reviews_fixture_id_fkey(id,kickoff_at,home_goals,away_goals,competition:sports_competitions!sports_fixtures_competition_id_fkey(name),home_team:sports_teams!sports_fixtures_home_team_id_fkey(name),away_team:sports_teams!sports_fixtures_away_team_id_fkey(name))",
    )
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (result.error) throw new BackendError("INTERNAL_ERROR", "Falha ao carregar sua fila de anotações.", 500);
  return records(result.data).map(parseQueueItem).filter((row): row is NotesQueueItem => row !== null);
}

export const getNotesOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NotesOverview> => {
    if (!context.userId) throw new BackendError("UNAUTHENTICATED", "Faça login para continuar.", 401);
    const db = (await adminDb()) as unknown as NotesDb;
    const enqueue = await db.rpc("enqueue_finished_sports_reviews", { p_owner_id: context.userId, p_limit: 100 });
    if (enqueue.error) throw new BackendError("INTERNAL_ERROR", "Falha ao atualizar a fila pós-jogo.", 500);
    return { observedAt: new Date().toISOString(), queue: await loadQueue(db, context.userId) };
  });

export const getNotesReviewDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => reviewIdSchema.parse(input))
  .handler(async ({ data, context }): Promise<NotesReviewDetail> => {
    if (!context.userId) throw new BackendError("UNAUTHENTICATED", "Faça login para continuar.", 401);
    const db = (await adminDb()) as unknown as NotesDb;
    await requireOwnedReview(db, context.userId, data.reviewId);

    const reviewResult = await db
      .from("sports_match_reviews")
      .select(
        "id,fixture_id,watched,notes,status,finalized_at,created_at,fixture:sports_fixtures!sports_match_reviews_fixture_id_fkey(id,kickoff_at,home_goals,away_goals,competition:sports_competitions!sports_fixtures_competition_id_fkey(name),home_team:sports_teams!sports_fixtures_home_team_id_fkey(name),away_team:sports_teams!sports_fixtures_away_team_id_fkey(name))",
      )
      .eq("id", data.reviewId)
      .eq("owner_id", context.userId)
      .limit(1)
      .maybeSingle();
    const review = isRecord(reviewResult.data) ? parseQueueItem(reviewResult.data) : null;
    if (reviewResult.error || !review) throw new BackendError("NOT_FOUND", "Anotação não encontrada.", 404);

    const [statsResult, ratingsResult, marksResult] = await Promise.all([
      db
        .from("sports_fixture_player_stats")
        .select("team_id,player_id,participation_state,minutes,provider_rating")
        .eq("fixture_id", review.fixtureId)
        .limit(100),
      db
        .from("sports_player_personal_ratings")
        .select("player_id,participation_state,rating,provider_rating_snapshot,notes")
        .eq("review_id", data.reviewId)
        .limit(100),
      db
        .from("sports_review_field_marks")
        .select("id,player_id,x_percent,y_percent,note")
        .eq("review_id", data.reviewId)
        .order("created_at", { ascending: true })
        .limit(200),
    ]);
    if (statsResult.error || ratingsResult.error || marksResult.error) {
      throw new BackendError("INTERNAL_ERROR", "Falha ao carregar o detalhamento da anotação.", 500);
    }

    const statRows = records(statsResult.data);
    const playerIds = Array.from(new Set(statRows.map((row) => text(row["player_id"])).filter((id): id is string => Boolean(id))));
    const teamIds = Array.from(new Set(statRows.map((row) => text(row["team_id"])).filter((id): id is string => Boolean(id))));
    const emptyResponse: DbResponse = { data: [], error: null };
    const [playersResult, teamsResult] = await Promise.all([
      playerIds.length ? db.from("sports_players").select("id,name").in("id", playerIds).limit(100) : Promise.resolve(emptyResponse),
      teamIds.length ? db.from("sports_teams").select("id,name").in("id", teamIds).limit(10) : Promise.resolve(emptyResponse),
    ]);
    if (playersResult.error || teamsResult.error) throw new BackendError("INTERNAL_ERROR", "Falha ao carregar participantes da partida.", 500);

    const playerNames = new Map(records(playersResult.data).map((row) => [text(row["id"]) ?? "", text(row["name"]) ?? "Jogador"] as const));
    const teamNames = new Map(records(teamsResult.data).map((row) => [text(row["id"]) ?? "", text(row["name"]) ?? "Equipe"] as const));
    const ratings = new Map(records(ratingsResult.data).map((row) => [text(row["player_id"]) ?? "", row] as const));

    const players: NotesPlayer[] = statRows
      .flatMap((row) => {
        const playerId = text(row["player_id"]);
        const teamId = text(row["team_id"]);
        if (!playerId || !teamId) return [];
        const personal = ratings.get(playerId);
        const participationRaw = text(row["participation_state"]);
        const participationState: NotesPlayer["participationState"] = participationRaw === "PARTICIPATED" || participationRaw === "DID_NOT_PLAY" ? participationRaw : "UNKNOWN";
        return [{
          playerId,
          name: playerNames.get(playerId) ?? "Jogador",
          teamId,
          teamName: teamNames.get(teamId) ?? "Equipe",
          participationState,
          minutes: numeric(row["minutes"]),
          providerRating: numeric(row["provider_rating"]),
          personalRating: personal ? numeric(personal["rating"]) : null,
          personalNotes: personal ? text(personal["notes"]) : null,
        }];
      })
      .sort((a, b) => a.teamName.localeCompare(b.teamName, "pt-BR") || (b.minutes ?? -1) - (a.minutes ?? -1));

    const fieldMarks: FieldMark[] = records(marksResult.data).flatMap((row) => {
      const id = text(row["id"]);
      const xPercent = numeric(row["x_percent"]);
      const yPercent = numeric(row["y_percent"]);
      if (!id || xPercent === null || yPercent === null) return [];
      const playerId = text(row["player_id"]);
      return [{
        id,
        playerId,
        playerName: playerId ? playerNames.get(playerId) ?? null : null,
        xPercent,
        yPercent,
        note: text(row["note"]),
      }];
    });

    return { review, players, fieldMarks };
  });

export const saveNotesReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => saveReviewSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!context.userId) throw new BackendError("UNAUTHENTICATED", "Faça login para continuar.", 401);
    const db = (await adminDb()) as unknown as NotesDb;
    await requireOwnedReview(db, context.userId, data.reviewId);
    const notes = data.watched === false ? null : data.notes?.trim() || null;
    const result = await db
      .from("sports_match_reviews")
      .update({ watched: data.watched, notes })
      .eq("id", data.reviewId)
      .eq("owner_id", context.userId)
      .select("id")
      .limit(1);
    if (result.error) throw new BackendError("INTERNAL_ERROR", "Falha ao salvar a anotação.", 500);
    return { ok: true };
  });

export const savePlayerPersonalRating = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => playerRatingSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!context.userId) throw new BackendError("UNAUTHENTICATED", "Faça login para continuar.", 401);
    const db = (await adminDb()) as unknown as NotesDb;
    await requireOwnedReview(db, context.userId, data.reviewId);
    if (data.rating !== null && data.participationState !== "PARTICIPATED") {
      throw new BackendError("VALIDATION_ERROR", "A nota pessoal só pode ser atribuída a quem participou.", 400);
    }
    const result = await db.from("sports_player_personal_ratings").upsert({
      review_id: data.reviewId,
      player_id: data.playerId,
      participation_state: data.participationState,
      rating: data.rating,
      provider_rating_snapshot: data.providerRatingSnapshot,
      notes: data.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "review_id,player_id" });
    if (result.error) throw new BackendError("INTERNAL_ERROR", "Falha ao salvar a nota do jogador.", 500);
    return { ok: true };
  });

export const addReviewFieldMark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => fieldMarkSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!context.userId) throw new BackendError("UNAUTHENTICATED", "Faça login para continuar.", 401);
    const db = (await adminDb()) as unknown as NotesDb;
    await requireOwnedReview(db, context.userId, data.reviewId);
    const result = await db.from("sports_review_field_marks").insert({
      review_id: data.reviewId,
      player_id: data.playerId,
      x_percent: data.xPercent,
      y_percent: data.yPercent,
      note: data.note?.trim() || null,
    });
    if (result.error) throw new BackendError("INTERNAL_ERROR", "Falha ao salvar a marcação do campinho.", 500);
    return { ok: true };
  });

export const deleteReviewFieldMark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => deleteFieldMarkSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!context.userId) throw new BackendError("UNAUTHENTICATED", "Faça login para continuar.", 401);
    const db = (await adminDb()) as unknown as NotesDb;
    await requireOwnedReview(db, context.userId, data.reviewId);
    const result = await db.from("sports_review_field_marks").delete().eq("id", data.markId).eq("review_id", data.reviewId);
    if (result.error) throw new BackendError("INTERNAL_ERROR", "Falha ao remover a marcação.", 500);
    return { ok: true };
  });

export const finalizeNotesReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => reviewIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!context.userId) throw new BackendError("UNAUTHENTICATED", "Faça login para continuar.", 401);
    const db = (await adminDb()) as unknown as NotesDb;
    await requireOwnedReview(db, context.userId, data.reviewId);
    const current = await db
      .from("sports_match_reviews")
      .select("watched")
      .eq("id", data.reviewId)
      .eq("owner_id", context.userId)
      .limit(1)
      .maybeSingle();
    if (current.error || !isRecord(current.data) || typeof current.data["watched"] !== "boolean") {
      throw new BackendError("VALIDATION_ERROR", "Informe primeiro se você assistiu à partida.", 400);
    }

    const watched = current.data["watched"];
    if (!watched) {
      await Promise.all([
        db.from("sports_player_personal_ratings").delete().eq("review_id", data.reviewId),
        db.from("sports_review_field_marks").delete().eq("review_id", data.reviewId),
      ]);
    }

    const patch = watched
      ? { status: "COMPLETED", finalized_at: new Date().toISOString() }
      : { status: "COMPLETED", finalized_at: new Date().toISOString(), notes: null };
    const result = await db
      .from("sports_match_reviews")
      .update(patch)
      .eq("id", data.reviewId)
      .eq("owner_id", context.userId);
    if (result.error) throw new BackendError("INTERNAL_ERROR", "Falha ao finalizar a anotação.", 500);
    return { ok: true };
  });
