import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";

export const Route = createFileRoute("/dashboard/configuracion/orden-servicio")(
  {
    component: RouteComponent,
  },
);

function RouteComponent() {
  return <Section>Hello "/dashboard/configuracion/orden-servicio"!</Section>;
}
