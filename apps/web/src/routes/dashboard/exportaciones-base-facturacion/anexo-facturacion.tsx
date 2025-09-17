import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import { NavTabs } from "../../../components/ui/common/NavTabs";
import { useState } from "react";
import type { TabsExportaciones } from "../../../types";
import {
  OrdenesTab,
  type OrderGroup,
} from "../../../components/ui/dashboard/exportaciones/OrdenesTab";

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
  const data: OrderGroup[] = [
    {
      id: "1",
      nombre: "Grupo 1",
      ordenes: [
        {
          id: "VR-1032",
          cliente: "Cliente 1",
          posicion: "Posicion 1",
          fechaInicio: "2021-01-01",
          fechaFin: "2021-01-01",
          fechaCreacion: "2021-01-01",
          descripcion: "Descripcion 1",
          estado: "pendiente",
          tecnico: "Tecnico 1",
        },
      ],
      fechaCreacion: "2021-01-01",
    },
  ];

  return (
    <Section>
      <NavTabs
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={(id) => setActiveTab(id as TabsExportaciones)}
      />
      {activeTab === "Generar" && (
        <OrdenesTab tipo="anexo-facturacion" data={data} />
      )}
      {activeTab === "Archivos generados" && (
        <OrdenesTab tipo="restaurar" data={data} />
      )}
    </Section>
  );
}
