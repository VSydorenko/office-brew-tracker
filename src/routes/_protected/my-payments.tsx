import { createFileRoute } from "@tanstack/react-router";
import MyPayments from "@/pages/MyPayments";

export const Route = createFileRoute("/_protected/my-payments")({
  component: MyPayments,
});