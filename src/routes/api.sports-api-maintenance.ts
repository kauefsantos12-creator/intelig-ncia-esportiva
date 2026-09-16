import { createFileRoute } from "@tanstack/react-router";

import { backendErrorResponse, backendJson, backendRequestId } from "@/lib/backend-contract";

export const Route = createFileRoute("/api/sports-api-maintenance")({
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
          const { authenticateSportsWorkerCronRequest } = await import("@/lib/sports/sports-worker-cron-auth.server");
          const denied = await authenticateSportsWorkerCronRequest(request);
          if (denied) {
            return Response.json(
              { ok: false, error: { code: "FORBIDDEN", message: "Solicitação não autorizada." }, requestId },
              { status: denied.status, headers: { "Cache-Control": "no-store" } },
            );
          }

          const { runSportsApiMaintenance } = await import("@/lib/sports/sports-api-maintenance.server");
          return backendJson(await runSportsApiMaintenance(), undefined, requestId);
        } catch (error) {
          console.error("[Sports API maintenance] failed", error);
          return backendErrorResponse(error, requestId);
        }
      },
    },
  },
});
