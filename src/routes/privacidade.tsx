import { createFileRoute } from "@tanstack/react-router";
import { PrivacyNotice } from "@/components/PrivacyNotice";
export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade · Meus Jogos" },
      { name: "description", content: "Como Meus Jogos trata seus dados pessoais." },
    ],
  }),
  component: () => (
    <main className="min-h-[100dvh] bg-background px-4 py-10 sm:px-6">
      <PrivacyNotice />
    </main>
  ),
});
