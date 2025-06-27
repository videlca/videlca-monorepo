import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";

export const Route = createFileRoute("/dashboard/personal/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Section>Hello "/dashboard/personal/personal"!</Section>;
}
