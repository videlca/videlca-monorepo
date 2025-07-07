import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { ClientesTableType } from "../../../types";
import {
  ClientesTab,
  LocacionesTab,
  SegmentacionTab,
  SubSegmentacionTab,
} from "../../../components/ui/dashboard/clientes";
import {
  dataClientes,
  dataLocaciones,
  dataSegmentacion,
  dataSubSegmentacion,
} from "../../../data/clientesData";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/clientes/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [activeTab, setActiveTab] = useState<ClientesTableType>("clientes");

  const tabs = [
    { id: "clientes" as ClientesTableType, label: "Clientes" },
    { id: "locaciones" as ClientesTableType, label: "Locaciones" },
    { id: "segmentacion" as ClientesTableType, label: "Segmentación" },
    { id: "sub-segmentacion" as ClientesTableType, label: "Sub-Segmentación" },
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
                className={`flex cursor-pointer items-center space-x-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
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
        {activeTab === "clientes" && (
          <ClientesTab dataClientes={dataClientes} />
        )}
        {activeTab === "locaciones" && (
          <LocacionesTab dataLocaciones={dataLocaciones} />
        )}
        {activeTab === "segmentacion" && (
          <SegmentacionTab dataSegmentacion={dataSegmentacion} />
        )}
        {activeTab === "sub-segmentacion" && (
          <SubSegmentacionTab dataSubSegmentacion={dataSubSegmentacion} />
        )}
      </div>
    </Section>
  );
}
