import { createFileRoute } from "@tanstack/react-router";
import RequireApproved from "@/components/auth/RequireApproved";

/**
 * Layout-маршрут із захистом: пропускає лише підтверджених користувачів.
 * Пряма трансляція <Route element={<RequireApproved />}> з попереднього App.tsx.
 */
export const Route = createFileRoute("/_protected")({
  component: () => <RequireApproved />,
});