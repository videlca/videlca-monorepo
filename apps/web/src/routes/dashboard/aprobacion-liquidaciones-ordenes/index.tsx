import { createFileRoute } from "@tanstack/react-router";
import { EyeOff, FileTextIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Section } from "../../../components/ui/dashboard/Section";

export const Route = createFileRoute(
  "/dashboard/aprobacion-liquidaciones-ordenes/",
)({
  component: RouteComponent,
});

interface ServiceOrder {
  id: string;
  cliente: string;
  posicion: string;
  fechaInicio: string;
  fechaFin: string;
  fechaCreacion: string;
  descripcion: string;
  estado: "pendiente" | "en_progreso" | "completado";
  tecnico: string;
}

interface OrderGroup {
  id: string;
  nombre: string;
  ordenes: ServiceOrder[];
  fechaCreacion: string;
}

function RouteComponent() {
  const [groups, setGroups] = useState<OrderGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [hiddenGroups, setHiddenGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    const savedGroups = localStorage.getItem("orderGroups");
    if (savedGroups) {
      try {
        const parsedGroups = JSON.parse(savedGroups);
        setGroups(parsedGroups);
      } catch (error) {
        console.error("Error parsing groups from localStorage:", error);
        setGroups([]);
      }
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedGroups = localStorage.getItem("orderGroups");
      if (savedGroups) {
        try {
          const parsedGroups = JSON.parse(savedGroups);
          setGroups(parsedGroups);
        } catch (error) {
          console.error("Error parsing groups from localStorage:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleHideOrders = (groupId: string) => {
    const newHidden = new Set(hiddenGroups);
    if (newHidden.has(groupId)) {
      newHidden.delete(groupId);
    } else {
      newHidden.add(groupId);
    }
    setHiddenGroups(newHidden);
  };

  const deleteGroup = (groupId: string) => {
    const updatedGroups = groups.filter((group) => group.id !== groupId);
    setGroups(updatedGroups);
    localStorage.setItem("orderGroups", JSON.stringify(updatedGroups));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completado":
        return "bg-green-100 text-green-700 border-green-200";
      case "en_progreso":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "pendiente":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <Section>
      <div className="flex flex-col gap-8">
        <p className="text-sm text-gray-500">
          Selecciona un grupo para aprobar la liquidación de las órdenes.
        </p>
        {groups.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <FileTextIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No hay grupos creados
            </h3>
            <p className="mb-4 text-gray-500">
              Crea tu primer grupo desde la pantalla de búsqueda de órdenes
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <div className="border-b border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {group.nombre}
                      </h2>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">ID:</span> {group.id} |
                        <span className="ml-1 font-medium">
                          {group.ordenes.length} órdenes
                        </span>{" "}
                        |<span className="ml-1 font-medium">Creado:</span>{" "}
                        {new Date(group.fechaCreacion).toLocaleDateString(
                          "es-ES",
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleHideOrders(group.id)}
                          className="flex items-center rounded-md px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
                          title={
                            hiddenGroups.has(group.id)
                              ? "Mostrar órdenes"
                              : "Ocultar órdenes"
                          }
                        >
                          <EyeOff className="mr-1 h-4 w-4" />
                          {hiddenGroups.has(group.id) ? "Mostrar" : "Ocultar"}
                        </button>
                        <button
                          onClick={() => deleteGroup(group.id)}
                          className="flex items-center rounded-md px-3 py-1 text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-800"
                        >
                          <TrashIcon className="mr-1 h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {!hiddenGroups.has(group.id) && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {group.ordenes.map((order) => (
                        <div
                          key={order.id}
                          className="rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900">
                              {order.id}
                            </h3>
                            <span
                              className={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusColor(order.estado)}`}
                            >
                              {order.estado.replace("_", " ")}
                            </span>
                          </div>

                          <div className="space-y-1 text-xs text-gray-600">
                            <div>
                              <span className="font-medium text-gray-900">
                                {order.cliente}
                              </span>
                            </div>
                            <div className="text-gray-500">
                              {order.posicion}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
