import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";

export const Route = createFileRoute("/dashboard/clientes/sub-segmentacion")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Section>Hello "/dashboard/clientes/sub-sebmentacion"!</Section>;
}
