import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";

export const Route = createFileRoute("/dashboard/tarifas/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Section>
      <div className="flex flex-col gap-8">
        <h1 className="text-2xl font-bold">Configurar tarifas</h1>
      </div>
    </Section>
  );
}
