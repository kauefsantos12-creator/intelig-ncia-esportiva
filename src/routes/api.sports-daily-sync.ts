import { createFileRoute } from "@tanstack/react-router";

import { backendErrorResponse, backendJson, backendRequestId } from "@/lib/backend-contract";

function validIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export const Route = createFileRoute("/api/sports-daily-sync")({
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

        try {
          const [{ fiveDollarConfigured }, { apiFootballConfigured }] = await Promise.all([
            import("@/lib/adapters/five_dollar.server"),
            import("@/lib/adapters/api_football.server"),
          ]);
          const providers = {
            fiveDollar: fiveDollarConfigured(),
            apiFootball: apiFootballConfigured(),
          };
          if (!providers.fiveDollar || !providers.apiFootball) {
            return Response.json(
              {
                ok: false,
                error: {
                  code: "INTERNAL_ERROR",
                  message: "Providers esportivos obrigatórios não estão configurados no runtime.",
                },
                data: { providers },
                requestId,
              },
              { status: 503, headers: { "Cache-Control": "no-store" } },
            );
          }

          const { syncFiveDollarDay } = await import("@/lib/sports/five-dollar-sports-sync.server");
          const result = await syncFiveDollarDay(date);
          return backendJson({ providers, ...result }, undefined, requestId);
        } catch (error) {
          console.error("[sports-daily-sync] protected sync failed", error);
          return backendErrorResponse(error, requestId);
        }
      },
    },
  },
});
