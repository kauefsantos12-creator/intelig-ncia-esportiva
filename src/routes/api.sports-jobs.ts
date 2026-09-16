import { createFileRoute } from "@tanstack/react-router";

import { backendErrorResponse, backendJson, backendRequestId } from "@/lib/backend-contract";

export const Route = createFileRoute("/api/sports-jobs")({
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
                message: denied.status >= 500 ? "Configuração do worker indisponível." : "Solicitação não autorizada.",
              },
              requestId,
            },
            { status: denied.status, headers: { "Cache-Control": "no-store" } },
          );
        }

        try {
          const { runSportsJobWorker } = await import("@/lib/sports/sports-job-worker.server");
          return backendJson(await runSportsJobWorker(), undefined, requestId);
        } catch (error) {
          console.error("[sports-job-worker] protected worker failed", error);
          return backendErrorResponse(error, requestId);
        }
      },
    },
  },
});
