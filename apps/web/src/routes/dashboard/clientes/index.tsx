import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { ClientesTableType } from "../../../types";
import {
  ClientesTab,
  LocacionesTab,
  SegmentacionTab,
} from "../../../components/ui/dashboard/clientes";
import { useState } from "react";
import { NavTabs } from "../../../components/ui/common/NavTabs";

export const Route = createFileRoute("/dashboard/clientes/")({
  component: RouteComponent,
  notFoundComponent: () => <div>Not Found</div>,
});

function RouteComponent() {
  const [activeTab, setActiveTab] = useState<ClientesTableType>("clientes");

  const tabs = [
    { id: "clientes" as ClientesTableType, label: "Clientes" },
    { id: "locaciones" as ClientesTableType, label: "Locaciones" },
    { id: "segmentacion" as ClientesTableType, label: "Segmentación" },
    // { id: "sub-segmentacion" as ClientesTableType, label: "Sub-Segmentación" },
  ];

  return (
    <Section>
      <NavTabs
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={(id) => setActiveTab(id as ClientesTableType)}
      />

      <div className="flex flex-col gap-8">
        {activeTab === "clientes" && <ClientesTab />}
        {activeTab === "locaciones" && <LocacionesTab />}
        {activeTab === "segmentacion" && <SegmentacionTab />}
      </div>
    </Section>
  );
}
