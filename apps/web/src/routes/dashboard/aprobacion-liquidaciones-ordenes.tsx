import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/aprobacion-liquidaciones-ordenes",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <></>;
}
