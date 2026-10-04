import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PermissionGuard } from "../../components/common/PermissionGuard";

export const Route = createFileRoute("/dashboard/personal")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PermissionGuard requiredModule="personal">
      <Outlet />
    </PermissionGuard>
  );
}
