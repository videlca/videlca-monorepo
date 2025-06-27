import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";

export const Route = createFileRoute("/dashboard/configuracion/ubicacion")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Section>Hello "/dashboard/configuracion/ubicacion"!</Section>;
}
