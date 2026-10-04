import { PageHeader } from "../../../components/ui/common/PageHeader";
import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";

export const Route = createFileRoute("/dashboard/tarifas/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Section>
      <PageHeader title="Configurar tarifas" />
    </Section>
  );
}
