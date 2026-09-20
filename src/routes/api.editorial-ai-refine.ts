import { createFileRoute } from "@tanstack/react-router";

import { backendErrorResponse, backendJson, backendRequestId } from "@/lib/backend-contract";

function validIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export const Route = createFileRoute("/api/editorial-ai-refine")({
  server: {
    handlers: {
      GET: async () => new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "POST", "Cache-Control": "no-store" },
      }),
      POST: async ({ request }) => {
        const requestId = backendRequestId();
        try {
          const { authenticateSportsWorkerCronRequest } = await import(
            "@/lib/sports/sports-worker-cron-auth.server"
          );
          const denied = await authenticateSportsWorkerCronRequest(request);
          if (denied) return denied;

          let payload: unknown;
          try {
            payload = await request.json();
          } catch {
            return Response.json(
              { ok: false, error: { code: "VALIDATION_ERROR", message: "JSON inválido." }, requestId },
              { status: 400, headers: { "Cache-Control": "no-store" } },
            );
          }

          const date = typeof payload === "object" && payload !== null
            ? (payload as Record<string, unknown>)["date"]
            : null;
          if (!validIsoDate(date)) {
            return Response.json(
              { ok: false, error: { code: "VALIDATION_ERROR", message: "date deve estar em YYYY-MM-DD." }, requestId },
              { status: 400, headers: { "Cache-Control": "no-store" } },
            );
          }

          const { refineSportsDailyBriefingWithAi } = await import(
            "@/lib/sports/editorial-ai-refinement.server"
          );
          return backendJson(await refineSportsDailyBriefingWithAi(date), undefined, requestId);
        } catch (error) {
          console.error("[editorial-ai-refine] refinement failed", error);
          return backendErrorResponse(error, requestId);
        }
      },
    },
  },
});
