import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import { useState } from "react";
import type { TableType } from "../../../types";
import {
  CiudadTab,
  DepartamentoTab,
  PaisTab,
} from "../../../components/ui/dashboard/ubicaciones";

export const Route = createFileRoute("/dashboard/configuracion/ubicacion")({
  component: RouteComponent,
});

function RouteComponent() {
  const [activeTab, setActiveTab] = useState<TableType>("ciudades");

  const tabs = [
    { id: "ciudades" as TableType, label: "Ciudades" },
    { id: "departamentos" as TableType, label: "Departamentos" },
    // { id: "paises" as TableType, label: "Paises" },
  ];

  return (
    <Section>
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex cursor-pointer items-center space-x-2 border-b-2 px-1 py-4 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      <div className="flex flex-col gap-8">
        {activeTab === "ciudades" && <CiudadTab />}
        {activeTab === "departamentos" && <DepartamentoTab />}
        {/* {activeTab === "paises" && <PaisTab />} */}
      </div>
    </Section>
  );
}
