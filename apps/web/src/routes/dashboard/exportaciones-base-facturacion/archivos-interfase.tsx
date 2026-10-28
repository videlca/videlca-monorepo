import { createFileRoute } from "@tanstack/react-router";
import type { TabsExportaciones } from "../../../types";
import { useState } from "react";
import { Section } from "../../../components/ui/dashboard/Section";
import { NavTabs } from "../../../components/ui/common/NavTabs";
import { OrdenesTab } from "../../../components/ui/dashboard/exportaciones/OrdenesTab";
import {
  FiltroMesExportacion,
  getMesActualExportacion,
  parseMesExportacion,
} from "../../../components/ui/dashboard/exportaciones/FiltroMesExportacion";
import {
  useEnviarCorreoExportacion,
  useGenerarInterfaseGrupos,
  useGenerarReporteArchivo,
  useGetGruposLiquidacionesExportaciones,
} from "../../../api/queryFunctions/exportaciones/exportaciones";
import { ButtonAction } from "../../../components/common/ButtonAction";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

export const Route = createFileRoute(
  "/dashboard/exportaciones-base-facturacion/archivos-interfase",
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
    campo: "generacion_interfase",
    valor: value,
    ...parseMesExportacion(mesGrupo),
  });

  // TODO: Cambiar POR MUTACIONES CORRECTAS
  // Mutaciones
  const { mutate: generarReporteInterfase } = useGenerarReporteArchivo(
    "generar-excel-interfase",
  );
  const {
    mutate: enviarCorreoExportacionInterfase,
    isPending: envioCorreoPending,
  } = useEnviarCorreoExportacion("enviar-excel-interfase");
  const { mutate: generarInterfaseGrupos, isPending: generandoInterfaseGrupos } =
    useGenerarInterfaseGrupos();

  // Todos los grupos que se ven en el tab y mes actuales
  const idsGrupos = (groups?.data ?? []).map((grupo) => grupo.idGrupoLiquidacion);

  // Handlers
  const handleGenerarReporteConsolidacion = (idGrupoLiquidacion: number) => {
    generarReporteInterfase(idGrupoLiquidacion);
  };

  return (
    <Section>
      <div className="flex justify-end">
        <ButtonAction
          Icon={FileDownloadOutlinedIcon}
          label={
            generandoInterfaseGrupos
              ? "Generando..."
              : "Generar archivo de interfase para todos los grupos"
          }
          type="button"
          disabled={idsGrupos.length === 0 || generandoInterfaseGrupos}
          onClick={() => generarInterfaseGrupos(idsGrupos)}
        />
      </div>
      <NavTabs
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={(id) => setActiveTab(id as TabsExportaciones)}
      />
      <FiltroMesExportacion value={mesGrupo} onChange={setMesGrupo} />
      {activeTab === "Generar" && (
        <OrdenesTab
          tipo="generacion_interfase"
          data={groups?.data || []}
          handleFileAction={handleGenerarReporteConsolidacion}
          mutationEmail={enviarCorreoExportacionInterfase}
          envioCorreoPending={envioCorreoPending}
        />
      )}
      {activeTab === "Archivos generados" && (
        <OrdenesTab
          tipo="generacion_interfase"
          data={groups?.data || []}
          handleFileAction={handleGenerarReporteConsolidacion}
          mutationEmail={enviarCorreoExportacionInterfase}
          envioCorreoPending={envioCorreoPending}
        />
      )}
    </Section>
  );
}
