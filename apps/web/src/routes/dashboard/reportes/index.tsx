import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/reportes/")({
  component: RouteComponent,
  notFoundComponent: () => <div>Not Found</div>,
});

function RouteComponent() {
  return <div>Hello "/dashboard/reportes/"!</div>;
}
