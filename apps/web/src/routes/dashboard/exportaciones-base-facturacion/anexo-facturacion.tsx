import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import { NavTabs } from "../../../components/ui/common/NavTabs";
import { useState } from "react";
import type { TabsExportaciones } from "../../../types";
import { OrdenesTab } from "../../../components/ui/dashboard/exportaciones/OrdenesTab";
import {
  useEnviarCorreoExportacion,
  useGenerarReporteArchivo,
  useGetGruposLiquidacionesExportaciones,
} from "../../../api/queryFunctions/exportaciones/exportaciones";

export const Route = createFileRoute(
  "/dashboard/exportaciones-base-facturacion/anexo-facturacion",
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
    campo: "generacion_anexo",
    valor: value,
  });

  // TODO: Cambiar POR MUTACIONES CORRECTAS

  // Mutaciones
  const { mutate: generarReporteAnexoFacturacion } = useGenerarReporteArchivo(
    "generar-anexos-facturacion",
  );
  const {
    mutate: enviarCorreoExportacionAnexoFacturacion,
    isPending: envioCorreoPending,
  } = useEnviarCorreoExportacion("enviar-anexos-facturacion");

  // Handlers
  const handlegenerarReporteAnexoFacturacion = (idGrupoLiquidacion: number) => {
    generarReporteAnexoFacturacion(idGrupoLiquidacion);
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
          tipo="generacion_anexo"
          data={groups?.data || []}
          handleFileAction={handlegenerarReporteAnexoFacturacion}
          mutationEmail={enviarCorreoExportacionAnexoFacturacion}
          envioCorreoPending={envioCorreoPending}
        />
      )}
      {activeTab === "Archivos generados" && (
        <OrdenesTab
          tipo="generacion_anexo"
          data={groups?.data || []}
          handleFileAction={handlegenerarReporteAnexoFacturacion}
          mutationEmail={enviarCorreoExportacionAnexoFacturacion}
          envioCorreoPending={envioCorreoPending}
        />
      )}
    </Section>
  );
}
