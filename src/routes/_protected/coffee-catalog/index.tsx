import { createFileRoute } from "@tanstack/react-router";
import CoffeeCatalog from "@/pages/CoffeeCatalog";

export const Route = createFileRoute("/_protected/coffee-catalog/")({
  head: () => ({
    meta: [
      { title: "Каталог кави — Облік кави в офісі" },
      { name: "description", content: "Каталог сортів кави з останніми цінами та датами покупок." },
      { property: "og:title", content: "Каталог кави — Облік кави в офісі" },
      { property: "og:description", content: "Каталог сортів кави з останніми цінами та датами покупок." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoffeeCatalog,
});