import { createFileRoute } from "@tanstack/react-router";
import { NavTabs } from "../../../components/ui/common/NavTabs";
import { Section } from "../../../components/ui/dashboard/Section";
import type { TabsExportaciones } from "../../../types";
import { useState } from "react";
import { OrdenesTab } from "../../../components/ui/dashboard/exportaciones/OrdenesTab";
import {
  FiltroMesExportacion,
  getMesActualExportacion,
  parseMesExportacion,
} from "../../../components/ui/dashboard/exportaciones/FiltroMesExportacion";
import {
  useEnviarCorreoExportacion,
  useGenerarReporteArchivo,
  useGetGruposLiquidacionesExportaciones,
} from "../../../api/queryFunctions/exportaciones/exportaciones";

export const Route = createFileRoute(
  "/dashboard/exportaciones-base-facturacion/consolidacion",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const [activeTab, setActiveTab] = useState<TabsExportaciones>("Generar");
  const [mesGrupo, setMesGrupo] = useState<string>(getMesActualExportacion);

  const tabs = [
    { id: "Generar" as TabsExportaciones, label: "Generar" },
    {
      id: "Archivos generados" as TabsExportaciones,
      label: "Archivos generados",
    },
  ];

  const value = activeTab === "Generar" ? "false" : "true";

  const { data: groups } = useGetGruposLiquidacionesExportaciones({
    campo: "consolidacion_orden",
    valor: value,
    ...parseMesExportacion(mesGrupo),
  });

  // Mutaciones
  const { mutate: generarReporteConsolidacion } = useGenerarReporteArchivo(
    "generar-excel-consolidacion",
  );
  const {
    mutate: enviarCorreoExportacionConsolidacion,
    isPending: envioCorreoPending,
  } = useEnviarCorreoExportacion("enviar-excel-consolidacion");

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
      <FiltroMesExportacion value={mesGrupo} onChange={setMesGrupo} />
      {activeTab === "Generar" && (
        <OrdenesTab
          tipo="consolidacion_orden"
          data={groups?.data || []}
          handleFileAction={handleGenerarReporteConsolidacion}
          mutationEmail={enviarCorreoExportacionConsolidacion}
          envioCorreoPending={envioCorreoPending}
        />
      )}
      {activeTab === "Archivos generados" && (
        <OrdenesTab
          tipo="consolidacion_orden"
          data={groups?.data || []}
          handleFileAction={handleGenerarReporteConsolidacion}
          mutationEmail={enviarCorreoExportacionConsolidacion}
          envioCorreoPending={envioCorreoPending}
        />
      )}
    </Section>
  );
}
