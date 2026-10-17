import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/anotacoes")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "historico" });
  },
});
