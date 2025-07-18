import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";

export const Route = createFileRoute("/dashboard/tarifas/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Section>
      <div>
        <h1>Tarifas</h1>
      </div>
    </Section>
  );
}
