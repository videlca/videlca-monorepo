import { createFileRoute } from "@tanstack/react-router";
import type { TabsExportaciones } from "../../../types";
import { useState } from "react";
import { Section } from "../../../components/ui/dashboard/Section";
import { NavTabs } from "../../../components/ui/common/NavTabs";
import { OrdenesTab } from "../../../components/ui/dashboard/exportaciones/OrdenesTab";
import {
  useEnviarCorreoExportacionConsolidacion,
  useGenerarReporteConsolidacion,
  useGetGruposLiquidacionesExportaciones,
} from "../../../api/queryFunctions/exportaciones/exportaciones";

export const Route = createFileRoute(
  "/dashboard/exportaciones-base-facturacion/archivos-interfase",
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

  const { data: groups } = useGetGruposLiquidacionesExportaciones({
    campo: "generacion_interfase",
    valor: value,
  });

  // TODO: Cambiar POR MUTACIONES CORRECTAS
  // Mutaciones
  const { mutate: generarReporteConsolidacion } =
    useGenerarReporteConsolidacion();
  const { mutate: enviarCorreoExportacionConsolidacion } =
    useEnviarCorreoExportacionConsolidacion();

  // Handlers
  const handleGenerarReporteConsolidacion = (idGrupoLiquidacion: number) => {
    generarReporteConsolidacion(idGrupoLiquidacion);
  };

  return (
    <Section>
      <NavTabs
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={(id) => setActiveTab(id as TabsExportaciones)}
      />
      {activeTab === "Generar" && (
        <OrdenesTab
          tipo="generacion_interfase"
          data={groups?.data || []}
          handleFileAction={handleGenerarReporteConsolidacion}
          mutationEmail={enviarCorreoExportacionConsolidacion}
        />
      )}
      {activeTab === "Archivos generados" && (
        <OrdenesTab
          tipo="generacion_interfase"
          data={groups?.data || []}
          handleFileAction={handleGenerarReporteConsolidacion}
          mutationEmail={enviarCorreoExportacionConsolidacion}
        />
      )}
    </Section>
  );
}
