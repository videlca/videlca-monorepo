import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PermissionGuard } from "../../components/common/PermissionGuard";

export const Route = createFileRoute("/dashboard/ordenes-servicio")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PermissionGuard requiredModule="ordenes-servicio">
      <Outlet />
    </PermissionGuard>
  );
}
