import { createFileRoute } from "@tanstack/react-router";
import Settings from "@/pages/Settings";

export const Route = createFileRoute("/_protected/settings")({
  head: () => ({
    meta: [
      { title: "Налаштування — Облік кави в офісі" },
      { name: "description", content: "Довідники, шаблони розподілу та налаштування системи обліку кави." },
      { property: "og:title", content: "Налаштування — Облік кави в офісі" },
      { property: "og:description", content: "Довідники, шаблони розподілу та налаштування системи обліку кави." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Settings,
});