import { createFileRoute } from "@tanstack/react-router";
import WaitingApproval from "@/pages/WaitingApproval";

export const Route = createFileRoute("/waiting-approval")({
  head: () => ({
    meta: [
      { title: "Очікування підтвердження — Облік кави в офісі" },
      { name: "description", content: "Ваш акаунт очікує підтвердження адміністратором." },
      { property: "og:title", content: "Очікування підтвердження — Облік кави в офісі" },
      { property: "og:description", content: "Ваш акаунт очікує підтвердження адміністратором." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WaitingApproval,
});