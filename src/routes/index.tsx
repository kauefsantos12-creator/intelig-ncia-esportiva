import { createFileRoute } from "@tanstack/react-router";
import { MyGamesPage } from "@/components/MyGamesPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meus Jogos · Inteligência Esportiva" },
      {
        name: "description",
        content: "Sua partida, escalações e relatos pessoais antes, durante e depois do jogo.",
      },
    ],
  }),
  component: MyGamesPage,
});
