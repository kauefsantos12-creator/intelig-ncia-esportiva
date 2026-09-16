import { sportsDb } from "./sports-db.server";

export async function authenticateSportsWorkerCronRequest(
  request: Request,
): Promise<Response | null> {
  const match = /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "");
  const token = match?.[1];
  if (!token) return new Response("Unauthorized", { status: 401 });

  const db = await sportsDb();
  const { data, error } = await db.rpc("verify_sports_worker_cron_token", {
    p_token: token,
  });

  if (error) {
    console.error("[sports-job-worker] cron token verification failed", error.message);
    return new Response("Server configuration error", { status: 500 });
  }

  if (data !== true) return new Response("Unauthorized", { status: 401 });
  return null;
}
