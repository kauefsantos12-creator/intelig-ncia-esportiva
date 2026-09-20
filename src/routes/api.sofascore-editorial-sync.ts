import { createFileRoute } from "@tanstack/react-router";

import { backendErrorResponse, backendJson, backendRequestId } from "@/lib/backend-contract";

function validIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export const Route = createFileRoute("/api/sofascore-editorial-sync")({
  server: {
    handlers: {
      GET: async () => {
        const requestId = backendRequestId();
        return Response.json(
          { ok: false, error: { code: "VALIDATION_ERROR", message: "Method Not Allowed" }, requestId },
          { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } },
        );
      },
      POST: async ({ request }) => {
        const requestId = backendRequestId();
        try {
          const { authenticateSportsWorkerCronRequest } = await import(
            "@/lib/sports/sports-worker-cron-auth.server"
          );
          const denied = await authenticateSportsWorkerCronRequest(request);
          if (denied) {
            return Response.json(
              {
                ok: false,
                error: {
                  code: denied.status >= 500 ? "INTERNAL_ERROR" : "FORBIDDEN",
                  message: denied.status >= 500 ? "Configuração do sync indisponível." : "Solicitação não autorizada.",
                },
                requestId,
              },
              { status: denied.status, headers: { "Cache-Control": "no-store" } },
            );
          }

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

          const { syncSofaScoreEditorialStats } = await import(
            "@/lib/sports/sofascore-editorial-sync.server"
          );
          return backendJson(await syncSofaScoreEditorialStats(date), undefined, requestId);
        } catch (error) {
          console.error("[sofascore-editorial-sync] protected sync failed", error);
          return backendErrorResponse(error, requestId);
        }
      },
    },
  },
});
