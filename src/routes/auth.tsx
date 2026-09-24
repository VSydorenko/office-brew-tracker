import { createFileRoute } from "@tanstack/react-router";
import Auth from "@/pages/Auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Вхід — Облік кави в офісі" },
      { name: "description", content: "Увійдіть або зареєструйтесь, щоб вести облік офісної кави." },
      { property: "og:title", content: "Вхід — Облік кави в офісі" },
      { property: "og:description", content: "Увійдіть або зареєструйтесь, щоб вести облік офісної кави." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Auth,
});