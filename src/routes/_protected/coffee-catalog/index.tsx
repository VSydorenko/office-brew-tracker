import { createFileRoute } from "@tanstack/react-router";
import CoffeeCatalog from "@/pages/CoffeeCatalog";

export const Route = createFileRoute("/_protected/coffee-catalog/")({
  component: CoffeeCatalog,
});