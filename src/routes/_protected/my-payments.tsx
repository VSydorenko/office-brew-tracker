import { createFileRoute } from "@tanstack/react-router";
import MyPayments from "@/pages/MyPayments";

export const Route = createFileRoute("/_protected/my-payments")({
  head: () => ({
    meta: [
      { title: "Мої платежі — Облік кави в офісі" },
      { name: "description", content: "Ваші нарахування та оплати за офісну каву." },
      { property: "og:title", content: "Мої платежі — Облік кави в офісі" },
      { property: "og:description", content: "Ваші нарахування та оплати за офісну каву." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyPayments,
});