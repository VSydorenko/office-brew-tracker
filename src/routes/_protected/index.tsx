import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";

export const Route = createFileRoute("/_protected/")({
  head: () => ({
    meta: [
      { title: "Дашборд — Облік кави в офісі" },
      { name: "description", content: "Огляд витрат на каву, статистика покупок і споживання в офісі." },
      { property: "og:title", content: "Дашборд — Облік кави в офісі" },
      { property: "og:description", content: "Огляд витрат на каву, статистика покупок і споживання в офісі." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});