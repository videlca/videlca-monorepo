import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/exportaciones-base-facturacion/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/dashboard/exportaciones-base-facturacion/"!</div>;
}
