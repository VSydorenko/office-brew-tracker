import { createFileRoute } from "@tanstack/react-router";
import CoffeeDetail from "@/pages/CoffeeDetail";

export const Route = createFileRoute("/_protected/coffee-catalog/$id")({
  head: () => ({
    meta: [
      { title: "Картка кави — Облік кави в офісі" },
      { name: "description", content: "Детальна інформація про сорт кави: обсмаження, походження, смаки та історія покупок." },
      { property: "og:title", content: "Картка кави — Облік кави в офісі" },
      { property: "og:description", content: "Детальна інформація про сорт кави: обсмаження, походження, смаки та історія покупок." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoffeeDetail,
});