import { createFileRoute } from "@tanstack/react-router";
import CoffeeDetail from "@/pages/CoffeeDetail";

export const Route = createFileRoute("/_protected/coffee-catalog/$id")({
  component: CoffeeDetail,
});