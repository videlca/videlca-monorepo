import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";

export const Route = createFileRoute("/dashboard/ordenes-de-servicio/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Section>
      <div>
        <h1>Ordenes de Servicio</h1>
      </div>
    </Section>
  );
}
