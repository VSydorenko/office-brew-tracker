import { createFileRoute } from "@tanstack/react-router";
import Purchases from "@/pages/Purchases";

export const Route = createFileRoute("/_protected/purchases")({
  head: () => ({
    meta: [
      { title: "Покупки кави — Облік кави в офісі" },
      { name: "description", content: "Список покупок кави, створення нових покупок і розподіл витрат між колегами." },
      { property: "og:title", content: "Покупки кави — Облік кави в офісі" },
      { property: "og:description", content: "Список покупок кави, створення нових покупок і розподіл витрат між колегами." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Purchases,
});