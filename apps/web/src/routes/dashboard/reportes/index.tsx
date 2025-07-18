import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";

export const Route = createFileRoute("/dashboard/reportes/")({
  component: RouteComponent,
  notFoundComponent: () => <div>Not Found</div>,
});

function RouteComponent() {
  return (
    <Section>
      <div>
        <h1>Reportes</h1>
      </div>
    </Section>
  );
}
