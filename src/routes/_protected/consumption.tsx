import { createFileRoute } from "@tanstack/react-router";
import Consumption from "@/pages/Consumption";

export const Route = createFileRoute("/_protected/consumption")({
  head: () => ({
    meta: [
      { title: "Споживання — Облік кави в офісі" },
      { name: "description", content: "Облік спожитої кави в офісі за періодами та користувачами." },
      { property: "og:title", content: "Споживання — Облік кави в офісі" },
      { property: "og:description", content: "Облік спожитої кави в офісі за періодами та користувачами." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Consumption,
});