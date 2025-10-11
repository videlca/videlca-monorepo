import { useMemo, useState } from "react";
import { Section } from "../Section";
import {
  BadgeDollarSign,
  EyeOff,
  FileSpreadsheetIcon,
  FileTextIcon,
  Mail,
} from "lucide-react";
import { getStatusColor } from "../../../../utils/StatusColor";
import type { TipoDocumento } from "../../../../api/dtos/exportaciones";
import type { ApiResponse, GruposLiquidaciones } from "../../../../api/types";
import { EnvioCorreos } from "../../modals/EnvioCorreos";
import type { UseMutateFunction } from "@tanstack/react-query";
import type { EnviarCorreoDto } from "../../../../api/dtos/common";

export function OrdenesTab({
  tipo,
  data,
  handleFileAction,
  mutationEmail,
}: {
  tipo: TipoDocumento;
  data: GruposLiquidaciones[];
  handleFileAction: (idGrupoLiquidacion: number) => void;
  mutationEmail: UseMutateFunction<
    ApiResponse<any>,
    Error,
    { id: number; data: EnviarCorreoDto }
  >;
}) {
  const [hiddenGroups, setHiddenGroups] = useState<Set<number>>(new Set());
  const [isOpenEmail, setIsOpenEmail] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number>(0);

  const acciones = useMemo(() => {
    return {
      consolidacion_orden: {
        label: "Generar Consolidación",
        icon: <FileSpreadsheetIcon className="mr-1 h-4 w-4" />,
        colors: {
          default: "text-green-600",
          hover: "hover:text-green-500",
          bg: "hover:bg-green-50",
        },
      },
      generacion_interfase: {
        label: "Generar Archivo de Interfase",
        icon: <FileTextIcon className="mr-1 h-4 w-4" />,
        colors: {
          default: "text-green-600",
          hover: "hover:text-green-500",
          bg: "hover:bg-green-50",
        },
      },
      generacion_anexo: {
        label: "Generar Anexo de Facturación",
        icon: <BadgeDollarSign className="mr-1 h-4 w-4" />,
        colors: {
          default: "text-green-600",
          hover: "hover:text-green-500",
          bg: "hover:bg-green-50",
        },
      },
    };
  }, [tipo]);

  const accion = acciones[tipo as keyof typeof acciones] || null;

  const handleActionClick = (groupId: number) => {
    handleFileAction(groupId);
  };

  const toggleHideOrders = (groupId: number) => {
    const newHidden = new Set(hiddenGroups);
    if (newHidden.has(groupId)) {
      newHidden.delete(groupId);
    } else {
      newHidden.add(groupId);
    }
    setHiddenGroups(newHidden);
  };

  return (
    <Section>
      <div className="flex flex-col gap-8">
        {data.length === 0 ? (
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
            {data.map((group) => (
              <div
                key={group.idGrupoLiquidacion}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <div className="border-b border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex w-full items-center justify-between space-x-4">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Descripción:</span>{" "}
                        {group.descripcion} |
                        <span className="ml-1 font-medium">
                          {group.liquidaciones.length} órdenes
                        </span>{" "}
                        |<span className="ml-1 font-medium">Creado:</span>{" "}
                        {new Date(group.fechaCreacion).toLocaleDateString(
                          "es-ES",
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            toggleHideOrders(group.idGrupoLiquidacion)
                          }
                          className="flex cursor-pointer items-center rounded-md px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
                          title={
                            hiddenGroups.has(group.idGrupoLiquidacion)
                              ? "Mostrar órdenes"
                              : "Ocultar órdenes"
                          }
                        >
                          <EyeOff className="mr-1 h-4 w-4" />
                          {hiddenGroups.has(group.idGrupoLiquidacion)
                            ? "Mostrar"
                            : "Ocultar"}
                        </button>
                        <button
                          onClick={() => {
                            setIsOpenEmail(true);
                            setSelectedOrderId(group.idGrupoLiquidacion);
                          }}
                          className={`flex cursor-pointer items-center rounded-md px-3 py-1 text-sm transition-colors ${accion?.colors.default} ${accion?.colors.hover} ${accion?.colors.bg}`}
                        >
                          <Mail className="mr-1 h-4 w-4" />
                          Enviar correo
                        </button>
                        <button
                          onClick={() => {
                            handleActionClick(group.idGrupoLiquidacion);
                          }}
                          className={`flex cursor-pointer items-center rounded-md px-3 py-1 text-sm transition-colors ${accion?.colors.default} ${accion?.colors.hover} ${accion?.colors.bg}`}
                        >
                          {accion?.icon}
                          {accion?.label}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {!hiddenGroups.has(group.idGrupoLiquidacion) && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {group.liquidaciones.map((order) => (
                        <div
                          key={order.idLiquidacion}
                          className="rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900">
                              {
                                order.ordenServicio.ordenServicioId
                                  .descripcionId
                              }
                            </h3>
                            <span
                              className={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusColor(order.ordenServicio.idEstadoOrdenServicio?.nombre || "")}`}
                            >
                              {
                                order.ordenServicio.idEstadoOrdenServicio
                                  ?.nombre
                              }
                            </span>
                          </div>

                          <div className="space-y-1 text-xs text-gray-600">
                            <div>
                              <span className="font-medium text-gray-900">
                                {
                                  order.ordenServicio.idLocacion?.idCliente
                                    .nombre
                                }
                              </span>
                            </div>
                            <div className="text-gray-500">
                              {order.ordenServicio.idLocacion?.nombre} -{" "}
                              {order.ordenServicio.idLocacion?.direccion}
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

      <EnvioCorreos
        isOpen={isOpenEmail}
        setIsOpen={setIsOpenEmail}
        id={selectedOrderId}
        mutationEmail={mutationEmail}
      />
    </Section>
  );
}
