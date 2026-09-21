import { createFileRoute } from "@tanstack/react-router";
import UserManagement from "@/pages/UserManagement";

export const Route = createFileRoute("/_protected/user-management")({
  component: UserManagement,
});