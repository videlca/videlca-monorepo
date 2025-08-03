import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import { useState } from "react";
import type { TableType } from "../../../types";
import {
  CiudadTab,
  DepartamentoTab,
} from "../../../components/ui/dashboard/ubicaciones";
import { NavTabs } from "../../../components/ui/common/NavTabs";

export const Route = createFileRoute("/dashboard/configuracion/ubicacion")({
  component: RouteComponent,
});

function RouteComponent() {
  const [activeTab, setActiveTab] = useState<TableType>("ciudades");

  const tabs = [
    { id: "ciudades" as TableType, label: "Ciudades" },
    { id: "departamentos" as TableType, label: "Departamentos" },
  ];

  return (
    <Section>
      <NavTabs
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={(id) => setActiveTab(id as TableType)}
      />
      <div className="flex flex-col gap-8">
        {activeTab === "ciudades" && <CiudadTab />}
        {activeTab === "departamentos" && <DepartamentoTab />}
      </div>
    </Section>
  );
}
