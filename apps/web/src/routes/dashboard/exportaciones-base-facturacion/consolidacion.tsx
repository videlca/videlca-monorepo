import { createFileRoute } from "@tanstack/react-router";
import { NavTabs } from "../../../components/ui/common/NavTabs";
import { Section } from "../../../components/ui/dashboard/Section";
import type { TabsExportaciones } from "../../../types";
import { useState } from "react";
import { OrdenesTab } from "../../../components/ui/dashboard/exportaciones/OrdenesTab";
import { useGetGruposLiquidacionesExportaciones } from "../../../api/queryFunctions/exportaciones/exportaciones";

export const Route = createFileRoute(
  "/dashboard/exportaciones-base-facturacion/consolidacion",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const [activeTab, setActiveTab] = useState<TabsExportaciones>("Generar");

  const tabs = [
    { id: "Generar" as TabsExportaciones, label: "Generar" },
    {
      id: "Archivos generados" as TabsExportaciones,
      label: "Archivos generados",
    },
  ];

  const value = activeTab === "Generar" ? "false" : "true";

  const { data: groups } = useGetGruposLiquidacionesExportaciones(
    "consolidacion_orden",
    value,
  );

  return (
    <Section>
      <NavTabs
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={(id) => setActiveTab(id as TabsExportaciones)}
      />
      {activeTab === "Generar" && (
        <OrdenesTab tipo="consolidacion_orden" data={groups?.data || []} />
      )}
      {activeTab === "Archivos generados" && (
        <OrdenesTab
          tipo="consolidacion_orden"
          data={groups?.data || []}
          restaurar={true}
        />
      )}
    </Section>
  );
}
