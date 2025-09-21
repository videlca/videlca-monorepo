import { createFileRoute } from "@tanstack/react-router";
import type { TabsExportaciones } from "../../../types";
import { useState } from "react";
import { Section } from "../../../components/ui/dashboard/Section";
import { NavTabs } from "../../../components/ui/common/NavTabs";
import { OrdenesTab } from "../../../components/ui/dashboard/exportaciones/OrdenesTab";
import { useGetGruposLiquidacionesExportaciones } from "../../../api/queryFunctions/exportaciones/exportaciones";

export const Route = createFileRoute(
  "/dashboard/exportaciones-base-facturacion/archivos-interfaz",
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
    "generacion_interfase",
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
        <OrdenesTab tipo="generacion_interfase" data={groups?.data || []} />
      )}
      {activeTab === "Archivos generados" && (
        <OrdenesTab
          tipo="generacion_interfase"
          data={groups?.data || []}
          restaurar={true}
        />
      )}
    </Section>
  );
}
