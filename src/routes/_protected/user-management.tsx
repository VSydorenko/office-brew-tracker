import { createFileRoute } from "@tanstack/react-router";
import UserManagement from "@/pages/UserManagement";

export const Route = createFileRoute("/_protected/user-management")({
  head: () => ({
    meta: [
      { title: "Користувачі — Облік кави в офісі" },
      { name: "description", content: "Керування користувачами та підтвердження доступу до обліку кави." },
      { property: "og:title", content: "Користувачі — Облік кави в офісі" },
      { property: "og:description", content: "Керування користувачами та підтвердження доступу до обліку кави." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UserManagement,
});