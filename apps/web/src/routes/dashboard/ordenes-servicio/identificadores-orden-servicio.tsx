import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import { useState } from "react";
import { NavTabs } from "../../../components/ui/common/NavTabs";
import type { OrdenServicioIdTableType } from "../../../types";
import { IdentificadoresEmitidos } from "../../../components/ui/dashboard/idOrdenes/IdentificadoresEmitidos";
import { IdentificadoresAnulados } from "../../../components/ui/dashboard/idOrdenes/IdentificadoresAnulados";

export const Route = createFileRoute(
  "/dashboard/ordenes-servicio/identificadores-orden-servicio",
)({
  component: RouteComponent,
});

function RouteComponent() {
  // Estados

  const [activeTab, setActiveTab] = useState<OrdenServicioIdTableType>("emitidos");

  const tabs = [
    { id: "emitidos", label: "Emitidos" },
    { id: "anulados", label: "Anulados" },
  ];


  return (
    <Section>
      <NavTabs
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={(id) => setActiveTab(id as OrdenServicioIdTableType)}
      />
      <div className="flex flex-col gap-8">
        {activeTab === "emitidos" && <IdentificadoresEmitidos />}
        {activeTab === "anulados" && <IdentificadoresAnulados />}
      </div>
    </Section>
  );
}
