import { createFileRoute } from "@tanstack/react-router";
import WaitingApproval from "@/pages/WaitingApproval";

export const Route = createFileRoute("/waiting-approval")({
  component: WaitingApproval,
});