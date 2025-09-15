import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Section } from "../../../components/ui/dashboard/Section";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PlusIcon, Search } from "lucide-react";
import { getYear, subYears } from "date-fns";
import { InputSelect } from "../../../components/common/InputSelect";
import {
  useCrearLiquidacionMensual,
  useGetLiquidacionesPorMes,
} from "../../../api/queryFunctions/liquidaciones";
import { priceFormat } from "../../../utils/PriceFormat";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/liquidaciones/")({
  component: RouteComponent,
});

const monthsOptions = [
  { id: 1, descripcion: "Enero" },
  { id: 2, descripcion: "Febrero" },
  { id: 3, descripcion: "Marzo" },
  { id: 4, descripcion: "Abril" },
  { id: 5, descripcion: "Mayo" },
  { id: 6, descripcion: "Junio" },
  { id: 7, descripcion: "Julio" },
  { id: 8, descripcion: "Agosto" },
  { id: 9, descripcion: "Septiembre" },
  { id: 10, descripcion: "Octubre" },
  { id: 11, descripcion: "Noviembre" },
  { id: 12, descripcion: "Diciembre" },
];

const yearsOptions = Array.from({ length: 10 }, (_, i) => {
  const year = getYear(subYears(new Date(), i));
  return { id: year, descripcion: year.toString() };
});

function RouteComponent() {
  const [searchMonth, setSearchMonth] = useState<string>("");
  const [searchYear, setSearchYear] = useState<string>("");
  const [groupName, setGroupName] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);

  // Queries y mutaciones
  const {
    data: liquidaciones,
    isLoading: isLoadingLiquidaciones,
    refetch: refetchLiquidaciones,
  } = useGetLiquidacionesPorMes(
    Number(searchYear),
    Number(searchMonth),
    isSearching,
  );
  const {
    mutateAsync: crearLiquidacionMensual,
    isPending: isCreatingLiquidacionMensualPending,
  } = useCrearLiquidacionMensual();

  const handleCreateLiquidacionMensual = async () => {
    if (selectedOrders.length === 0) {
      toast.error("No se han seleccionado órdenes de servicio");
      return;
    }

    if (!groupName.trim()) {
      toast.error("El nombre del grupo es requerido");
      return;
    }

    await crearLiquidacionMensual(
      {
        anio: Number(searchYear),
        mes: Number(searchMonth),
        descripcion: groupName,
        ordenIds: selectedOrders,
      },
      {
        onSuccess: () => {
          setGroupName("");
          setSelectedOrders([]);
          setIsSearching(false);
        },
      },
    );
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "completado":
        return "bg-green-100 text-green-800 border-green-200";
      case "en_progreso":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Section>
      <div className="flex flex-col gap-8">
        <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Filtros de Búsqueda</h2>
          <p className="mb-4 text-sm text-gray-500">
            Selecciona el mes y año para filtrar las órdenes de servicio.
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-48 flex-1">
              <InputSelect
                label="Mes"
                placeholder="Selecciona un mes"
                id="searchMonth"
                value={searchMonth}
                onChange={(e) => {
                  setSearchMonth(e.target.value);
                  setIsSearching(false);
                  setSelectedOrders([]);
                }}
                options={monthsOptions}
              />
            </div>

            <div className="min-w-48 flex-1">
              <InputSelect
                label="Año"
                placeholder="Selecciona un año"
                id="searchYear"
                value={searchYear}
                onChange={(e) => {
                  setSearchYear(e.target.value);
                  setIsSearching(false);
                  setSelectedOrders([]);
                }}
                options={yearsOptions as { id: number; descripcion: string }[]}
              />
            </div>
            <ButtonAction
              onClick={() => {
                setIsSearching(true);
                refetchLiquidaciones();
                setSelectedOrders([]);
              }}
              disabled={isLoadingLiquidaciones}
              Icon={Search}
              label={isLoadingLiquidaciones ? "Buscando..." : "Buscar"}
            />
          </div>
        </div>
      </div>

      {liquidaciones?.data?.length && liquidaciones?.data?.length > 0 ? (
        <div className="space-y-4 rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
          <div className="border-b border-gray-300 pb-4">
            <h3 className="mb-3 text-lg font-semibold">Crear Grupo</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Nombre del grupo"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                disabled={selectedOrders?.length === 0}
              />
              <ButtonAction
                onClick={() => {
                  handleCreateLiquidacionMensual();
                }}
                disabled={
                  !groupName.trim() || isCreatingLiquidacionMensualPending
                }
                Icon={PlusIcon}
                label="Crear Grupo"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Los grupos creados se pueden visualizar en la pestaña "Grupos de
              Órdenes"
            </p>
          </div>

          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Resultados ({liquidaciones?.data?.length} órdenes encontradas)
            </h2>
            {selectedOrders?.length > 0 && (
              <span className="text-sm text-gray-500">
                {selectedOrders?.length} seleccionadas
              </span>
            )}
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {liquidaciones?.data?.map((order, index) => (
              <div
                key={index}
                onClick={() => {
                  if (selectedOrders.includes(order.idOrdenServicio || 0)) {
                    setSelectedOrders(
                      selectedOrders.filter(
                        (id) => id !== order.idOrdenServicio || 0,
                      ),
                    );
                  } else {
                    setSelectedOrders([
                      ...selectedOrders,
                      order.idOrdenServicio || 0,
                    ]);
                  }
                }}
                className={`cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${
                  selectedOrders.includes(order.idOrdenServicio || 0)
                    ? "border-blue-400 bg-blue-100/40 shadow-sm"
                    : "border-gray-300 bg-white hover:border-gray-500"
                }`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {order.ordenServicioId.descripcionId}
                  </h3>
                  <span
                    className={`rounded-full border px-2 py-1 text-xs ${getStatusColor(order.idEstadoOrdenServicio?.nombre || "")}`}
                  >
                    {order.idEstadoOrdenServicio?.nombre}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Cliente:</span>
                    <p className="text-gray-900">
                      {order.ordenServicioId.descripcionId}
                    </p>
                  </div>

                  <div>
                    <span className="font-medium text-gray-500">Puesto:</span>
                    <p className="text-gray-900">{order.idLocacion?.nombre}</p>
                  </div>

                  <div>
                    <span className="font-medium text-gray-500">
                      Precio Total:
                    </span>
                    <p className="text-green-600">
                      {priceFormat(Number(order.precioTotal))}
                    </p>
                  </div>

                  <div className="border-border mt-2 grid grid-cols-2 gap-2 border-t pt-2">
                    <div>
                      <span className="font-medium text-gray-500">Inicio:</span>
                      <p className="text-gray-900">
                        {order?.fechaInicioOrden || ""}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Fin:</span>
                      <p className="text-gray-900">
                        {order?.fechaFinOrden || ""}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Section>
  );
}
