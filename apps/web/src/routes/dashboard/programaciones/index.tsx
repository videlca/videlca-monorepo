import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";

export const Route = createFileRoute("/dashboard/programaciones/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Section>
      <div>
        <h1>Programaciones</h1>
      </div>
    </Section>
  );
}
