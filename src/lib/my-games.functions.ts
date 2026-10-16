import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { BackendError } from "./backend-contract";
import { fromBrazilDateTimeInput } from "./personal-match-report";
import { parseMyGame, parseMyGameLineup, type MyGame, type MyGameLineup } from "./my-games";

type Result = { data: unknown; error: unknown };
interface Query extends PromiseLike<Result> {
  select(columns: string): Query;
  eq(column: string, value: string): Query;
  gte(column: string, value: string): Query;
  lt(column: string, value: string): Query;
  order(column: string, options: { ascending: boolean }): Query;
  limit(count: number): Query;
}
interface GamesDb {
  from(table: string): Query;
}
const fixtureColumns =
  "id,kickoff_at,home_team_id,away_team_id,metadata,home:sports_teams!sports_fixtures_home_team_id_fkey(name),away:sports_teams!sports_fixtures_away_team_id_fkey(name),competition:sports_competitions!sports_fixtures_competition_id_fkey(name)";
const dateInput = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
      const day = new Date(`${value}T12:00:00Z`);
      return Number.isFinite(day.getTime()) && day.toISOString().startsWith(value);
    }),
});

export const getMyGamesForDate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => dateInput.parse(input))
  .handler(async ({ data, context }): Promise<MyGame[]> => {
    if (!context.userId)
      throw new BackendError("UNAUTHENTICATED", "Faça login para continuar.", 401);
    const next = new Date(`${data.date}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    const db = context.supabase as unknown as GamesDb;
    const result = await db
      .from("sports_fixtures")
      .select(fixtureColumns)
      .gte("kickoff_at", fromBrazilDateTimeInput(`${data.date}T00:00`))
      .lt("kickoff_at", fromBrazilDateTimeInput(`${next.toISOString().slice(0, 10)}T00:00`))
      .order("kickoff_at", { ascending: true })
      .limit(300);
    if (result.error || !Array.isArray(result.data))
      throw new BackendError("INTERNAL_ERROR", "Não foi possível carregar as partidas.", 500);
    return result.data.map(parseMyGame).filter((game): game is MyGame => game !== null);
  });

export const getMyGameLineup = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ fixtureId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<MyGameLineup> => {
    if (!context.userId)
      throw new BackendError("UNAUTHENTICATED", "Faça login para continuar.", 401);
    const db = context.supabase as unknown as GamesDb;
    const [fixture, lineup] = await Promise.all([
      db.from("sports_fixtures").select(fixtureColumns).eq("id", data.fixtureId).limit(1),
      db
        .from("sports_fixture_lineups")
        .select(
          "player_id,team_id,provider,is_starting,is_substitute,position,jersey_number,formation,fetched_at,metadata,player:sports_players!sports_fixture_lineups_player_id_fkey(name)",
        )
        .eq("fixture_id", data.fixtureId)
        .order("fetched_at", { ascending: false })
        .limit(200),
    ]);
    if (
      fixture.error ||
      lineup.error ||
      !Array.isArray(fixture.data) ||
      !Array.isArray(lineup.data)
    )
      throw new BackendError("INTERNAL_ERROR", "Não foi possível carregar a escalação.", 500);
    if (!fixture.data.length) throw new BackendError("NOT_FOUND", "Partida não disponível.", 404);
    return parseMyGameLineup(fixture.data[0], lineup.data);
  });
