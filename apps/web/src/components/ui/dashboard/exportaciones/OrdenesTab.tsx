import { useMemo, useState } from "react";
import { Section } from "../Section";
import {
  BadgeDollarSign,
  EyeOff,
  FileSpreadsheetIcon,
  FileTextIcon,
  RotateCcwIcon,
} from "lucide-react";

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

export interface OrderGroup {
  id: string;
  nombre: string;
  ordenes: ServiceOrder[];
  fechaCreacion: string;
}

type Tipo =
  | "consolidacion"
  | "archivo-interfaz"
  | "anexo-facturacion"
  | "restaurar";

export function OrdenesTab({ tipo, data }: { tipo: Tipo; data: OrderGroup[] }) {
  const [groups, setGroups] = useState<OrderGroup[]>(
    data || [
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
          {
            id: "VR-1031",
            cliente: "Cliente 2",
            posicion: "Posicion 2",
            fechaInicio: "2021-01-02",
            fechaFin: "2021-01-02",
            fechaCreacion: "2021-01-02",
            descripcion: "Descripcion 2",
            estado: "en_progreso",
            tecnico: "Tecnico 2",
          },
        ],
        fechaCreacion: "2021-01-01",
      },
      {
        id: "2",
        nombre: "Grupo 2",
        ordenes: [
          {
            id: "VF-1037",
            cliente: "Cliente 3",
            posicion: "Posicion 3",
            fechaInicio: "2021-01-03",
            fechaFin: "2021-01-03",
            fechaCreacion: "2021-01-03",
            descripcion: "Descripcion 3",
            estado: "pendiente",
            tecnico: "Tecnico 3",
          },
          {
            id: "VF-1037",
            cliente: "Cliente 3",
            posicion: "Posicion 3",
            fechaInicio: "2021-01-03",
            fechaFin: "2021-01-03",
            fechaCreacion: "2021-01-03",
            descripcion: "Descripcion 3",
            estado: "pendiente",
            tecnico: "Tecnico 3",
          },
          {
            id: "VF-1036",
            cliente: "Cliente 4",
            posicion: "Posicion 4",
            fechaInicio: "2021-01-04",
            fechaFin: "2021-01-04",
            fechaCreacion: "2021-01-04",
            descripcion: "Descripcion 4",
            estado: "pendiente",
            tecnico: "Tecnico 4",
          },
          {
            id: "VF-1035",
            cliente: "Cliente 5",
            posicion: "Posicion 5",
            fechaInicio: "2021-01-05",
            fechaFin: "2021-01-05",
            fechaCreacion: "2021-01-05",
            descripcion: "Descripcion 5",
            estado: "en_progreso",
            tecnico: "Tecnico 5",
          },
        ],
        fechaCreacion: "2021-01-02",
      },
      {
        id: "3",
        nombre: "Grupo 3",
        ordenes: [
          {
            id: "MN-1033",
            cliente: "Cliente 6",
            posicion: "Posicion 6",
            fechaInicio: "2021-01-06",
            fechaFin: "2021-01-06",
            fechaCreacion: "2021-01-06",
            descripcion: "Descripcion 6",
            estado: "completado",
            tecnico: "Tecnico 6",
          },
        ],
        fechaCreacion: "2021-01-03",
      },
    ],
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [hiddenGroups, setHiddenGroups] = useState<Set<string>>(new Set());

  const acciones = useMemo(() => {
    return {
      consolidacion: {
        label: "Generar Consolidación",
        icon: <FileSpreadsheetIcon className="mr-1 h-4 w-4" />,
        colors: {
          default: "text-green-600",
          hover: "hover:text-green-500",
          bg: "hover:bg-green-50",
        },
      },
      "archivo-interfaz": {
        label: "Generar Archivo de Interfaz",
        icon: <FileTextIcon className="mr-1 h-4 w-4" />,
        colors: {
          default: "text-green-600",
          hover: "hover:text-green-500",
          bg: "hover:bg-green-50",
        },
      },
      "anexo-facturacion": {
        label: "Generar Anexo de Facturación",
        icon: <BadgeDollarSign className="mr-1 h-4 w-4" />,
        colors: {
          default: "text-green-600",
          hover: "hover:text-green-500",
          bg: "hover:bg-green-50",
        },
      },
      restaurar: {
        label: "Restaurar",
        icon: <RotateCcwIcon className="mr-1 h-4 w-4" />,
        colors: {
          default: "text-blue-600",
          hover: "hover:text-blue-500",
          bg: "hover:bg-blue-50",
        },
      },
    };
  }, [tipo]);

  const accion = acciones[tipo as keyof typeof acciones] || null;

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
                    <div className="flex w-full items-center justify-between space-x-4">
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
                          className="flex cursor-pointer items-center rounded-md px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
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
                          onClick={() => {}}
                          className={`flex cursor-pointer items-center rounded-md px-3 py-1 text-sm transition-colors ${accion?.colors.default} ${accion?.colors.hover} ${accion?.colors.bg}`}
                        >
                          {accion?.icon}
                          {accion?.label}
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
