import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/exportaciones-base-facturacion",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <></>;
}
