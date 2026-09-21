import { createFileRoute } from "@tanstack/react-router";
import Purchases from "@/pages/Purchases";

export const Route = createFileRoute("/_protected/purchases")({
  component: Purchases,
});