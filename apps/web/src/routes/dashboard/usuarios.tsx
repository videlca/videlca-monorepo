import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ProtectedRoute } from "../../components/common/ProtectedRoute";

export const Route = createFileRoute("/dashboard/usuarios")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ProtectedRoute requiredModule="usuarios">
      <Outlet />
    </ProtectedRoute>
  );
}
