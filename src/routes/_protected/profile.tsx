import { createFileRoute } from "@tanstack/react-router";
import Profile from "@/pages/Profile";

export const Route = createFileRoute("/_protected/profile")({
  head: () => ({
    meta: [
      { title: "Профіль — Облік кави в офісі" },
      { name: "description", content: "Налаштування профілю, аватара та платіжних реквізитів." },
      { property: "og:title", content: "Профіль — Облік кави в офісі" },
      { property: "og:description", content: "Налаштування профілю, аватара та платіжних реквізитів." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});