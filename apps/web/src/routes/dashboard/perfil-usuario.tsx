import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/perfil-usuario")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/dashboard/perfil-usuario"!</div>;
}
