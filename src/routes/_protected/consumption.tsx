import { createFileRoute } from "@tanstack/react-router";
import Consumption from "@/pages/Consumption";

export const Route = createFileRoute("/_protected/consumption")({
  component: Consumption,
});