import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PermissionGuard } from "../../components/common/PermissionGuard";

export const Route = createFileRoute("/dashboard/liquidaciones")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PermissionGuard requiredModule="liquidaciones">
      <Outlet />
    </PermissionGuard>
  );
}
