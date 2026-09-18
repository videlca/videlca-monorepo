import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Section } from "../../../components/ui/dashboard/Section";
import { ButtonAction } from "../../../components/common/ButtonAction";
import {
  AlertCircleIcon,
  CheckIcon,
  FileTextIcon,
  PlusIcon,
  Search,
} from "lucide-react";
import { format, getYear, subYears } from "date-fns";
import { es } from "date-fns/locale";
import { InputSelect } from "../../../components/common/InputSelect";
import {
  useCrearLiquidacionMensual,
  useGetAdicionalesPorMes,
  useGetLiquidacionesPorMes,
} from "../../../api/queryFunctions/liquidaciones";
import { priceFormat } from "../../../utils/PriceFormat";
import { safeParseDate } from "../../../utils/DateUtils";
import { toast } from "sonner";
import { getStatusColor } from "../../../utils/StatusColor";

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

const currentYear = getYear(new Date()).toString();
const currentMonth = (new Date().getMonth() + 1).toString();

const formatMesAdicional = (fecha: string) =>
  format(safeParseDate(fecha), "MMMM yyyy", { locale: es });

function RouteComponent() {
  const [searchMonth, setSearchMonth] = useState<string>(currentMonth);
  const [searchYear, setSearchYear] = useState<string>(currentYear);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [selectedAdicionales, setSelectedAdicionales] = useState<number[]>([]);

  // Queries y mutaciones
  const {
    data: liquidaciones,
    isLoading: isLoadingLiquidaciones,
    refetch: refetchLiquidaciones,
    isError: isErrorLiquidaciones,
    error: errorLiquidaciones,
  } = useGetLiquidacionesPorMes(
    Number(searchYear),
    Number(searchMonth),
    isSearching,
  );

  const liquidacionesData = Array.isArray(liquidaciones?.data)
    ? liquidaciones.data
    : Array.isArray(liquidaciones?.data?.data)
      ? liquidaciones.data.data
      : [];

  const {
    data: adicionales,
    isLoading: isLoadingAdicionales,
    refetch: refetchAdicionales,
    isError: isErrorAdicionales,
    error: errorAdicionales,
  } = useGetAdicionalesPorMes(
    Number(searchYear),
    Number(searchMonth),
    isSearching,
  );

  const adicionalesData = Array.isArray(adicionales?.data) ? adicionales.data : [];

  const {
    mutateAsync: crearLiquidacionMensual,
    isPending: isCreatingLiquidacionMensualPending,
  } = useCrearLiquidacionMensual();

  const handleCreateLiquidacionMensual = async () => {
    if (selectedOrders.length === 0 && selectedAdicionales.length === 0) {
      toast.error("No se han seleccionado órdenes de servicio ni adicionales");
      return;
    }

    await crearLiquidacionMensual(
      {
        anio: Number(searchYear),
        mes: Number(searchMonth),
        ordenIds: selectedOrders,
        adicionalIds: selectedAdicionales,
      },
      {
        onSuccess: () => {
          setSelectedOrders([]);
          setSelectedAdicionales([]);
          setIsSearching(false);
        },
      },
    );
  };

  const hayResultados = liquidacionesData.length > 0 || adicionalesData.length > 0;

  return (
    <Section>
      <div className="flex flex-col gap-8">
        <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Filtros de Búsqueda</h2>
          <p className="mb-4 text-sm text-gray-500">
            Selecciona el mes y año para filtrar las órdenes de servicio y adicionales.
          </p>
          <div className="flex flex-wrap items-end gap-4">
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
                  setSelectedAdicionales([]);
                }}
                options={yearsOptions as { id: number; descripcion: string }[]}
              />
            </div>
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
                  setSelectedAdicionales([]);
                }}
                options={monthsOptions}
              />
            </div>
            <ButtonAction
              onClick={() => {
                setIsSearching(true);
                refetchLiquidaciones();
                refetchAdicionales();
                setSelectedOrders([]);
                setSelectedAdicionales([]);
              }}
              disabled={isLoadingLiquidaciones || isLoadingAdicionales}
              Icon={Search}
              label={
                isLoadingLiquidaciones || isLoadingAdicionales
                  ? "Buscando..."
                  : "Buscar"
              }
            />
          </div>
        </div>
      </div>

      {isSearching &&
        !isLoadingLiquidaciones &&
        !isLoadingAdicionales &&
        (!hayResultados || (isErrorLiquidaciones && isErrorAdicionales)) && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              {isErrorLiquidaciones && isErrorAdicionales ? (
                <AlertCircleIcon className="h-12 w-12 text-gray-400" />
              ) : (
                <FileTextIcon className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              {isErrorLiquidaciones && isErrorAdicionales
                ? errorLiquidaciones?.message || errorAdicionales?.message
                : "No se encontraron órdenes de servicio ni adicionales"}
            </h3>
          </div>
        )}

      {isSearching && !isLoadingLiquidaciones && !isLoadingAdicionales && hayResultados ? (
        <div className="space-y-8">
          {liquidacionesData.length > 0 && (
            <div className="space-y-4 rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
              <div className="mb-8 flex justify-between">
                <div className="mb-2 flex-col items-start justify-between gap-2">
                  <h2 className="text-xl font-semibold">
                    Órdenes de Servicio ({liquidacionesData.length} encontradas)
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedOrders?.length > 0
                      ? `${selectedOrders?.length > 1 ? "órdenes seleccionadas" : "órden seleccionada"}`
                      : "No hay órdenes seleccionadas"}
                  </p>
                </div>
                <div className="mb-2 flex items-center justify-end gap-2">
                  <ButtonAction
                    onClick={() => {
                      setSelectedOrders(
                        liquidacionesData.map(
                          (order) => order.idOrdenServicio || 0,
                        ) || [],
                      );
                    }}
                    disabled={
                      selectedOrders?.length === liquidacionesData.length
                    }
                    Icon={CheckIcon}
                    label="Seleccionar Todos"
                  />
                </div>
              </div>

              <div className="mb-2 grid grid-cols-1 gap-2">
                {liquidacionesData.map((order, index) => (
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
                    className={`cursor-pointer rounded-lg border px-4 py-2 transition-all hover:shadow-md ${selectedOrders.includes(order.idOrdenServicio || 0)
                        ? "border-blue-400 bg-blue-100/40 shadow-sm"
                        : "border-gray-300 bg-white hover:border-gray-500"
                      }`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900">
                        {order.ordenServicioId?.descripcionId}
                      </h3>
                      <span
                        className={`rounded-full border px-2 py-1 text-xs capitalize ${getStatusColor(order.idEstadoOrdenServicio?.nombre || "")}`}
                      >
                        {order.idEstadoOrdenServicio?.nombre}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 space-y-2">
                      <div className="col-span-2 md:col-span-1 lg:col-span-1">
                        <span className="font-medium text-gray-500">Cliente:</span>
                        <p className="text-gray-900">
                          {order.idLocacion?.idCliente?.nombre ||
                            order.idCliente?.nombre}
                        </p>
                      </div>

                      {/* Monitoreo de alarmas no tiene puesto/locacion asociado (va directo a un cliente, ver
                          "Cliente" arriba), no hay nada que mostrar aca */}
                      {order.idLocacion && (
                        <div className="col-span-2 md:col-span-1 lg:col-span-1">
                          <span className="font-medium text-gray-500">Puesto:</span>
                          <p className="whitespace-nowrap text-gray-900">
                            {`${order.idLocacion.nombre} - ${order.idLocacion.direccion}`}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 space-y-2 text-sm md:grid-cols-3">
                      <div className="col-span-2 md:col-span-1 lg:col-span-1">
                        <span className="font-medium text-gray-500">
                          Precio Total:
                        </span>
                        <p className="text-green-600">
                          {priceFormat(Number(order.precioTotal))}
                        </p>
                      </div>

                      <div className="col-span-2 md:col-span-1 lg:col-span-1">
                        <span className="font-medium text-gray-500">Inicio:</span>
                        <p className="text-gray-900">{order?.fechaInicio || ""}</p>
                      </div>
                      <div className="col-span-2 md:col-span-1 lg:col-span-1">
                        <span className="font-medium text-gray-500">Fin:</span>
                        <p className="text-gray-900">
                          {order?.fechaFin || "Indefinida"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adicionalesData.length > 0 && (
            <div className="space-y-4 rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
              <div className="mb-8 flex justify-between">
                <div className="mb-2 flex-col items-start justify-between gap-2">
                  <h2 className="text-xl font-semibold">
                    Adicionales ({adicionalesData.length} encontrados)
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedAdicionales?.length > 0
                      ? `${selectedAdicionales?.length > 1 ? "adicionales seleccionados" : "adicional seleccionado"}`
                      : "No hay adicionales seleccionados"}
                  </p>
                </div>
                <div className="mb-2 flex items-center justify-end gap-2">
                  <ButtonAction
                    onClick={() => {
                      setSelectedAdicionales(
                        adicionalesData.map((adicional) => adicional.idAdicional) || [],
                      );
                    }}
                    disabled={selectedAdicionales?.length === adicionalesData.length}
                    Icon={CheckIcon}
                    label="Seleccionar Todos"
                  />
                </div>
              </div>

              <div className="mb-2 grid grid-cols-1 gap-2">
                {adicionalesData.map((adicional) => (
                  <div
                    key={adicional.idAdicional}
                    onClick={() => {
                      if (selectedAdicionales.includes(adicional.idAdicional)) {
                        setSelectedAdicionales(
                          selectedAdicionales.filter((id) => id !== adicional.idAdicional),
                        );
                      } else {
                        setSelectedAdicionales([
                          ...selectedAdicionales,
                          adicional.idAdicional,
                        ]);
                      }
                    }}
                    className={`cursor-pointer rounded-lg border px-4 py-2 transition-all hover:shadow-md ${selectedAdicionales.includes(adicional.idAdicional)
                        ? "border-blue-400 bg-blue-100/40 shadow-sm"
                        : "border-gray-300 bg-white hover:border-gray-500"
                      }`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900">{adicional.nombre}</h3>
                      <span className="rounded-full border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                        Adicional
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 space-y-2">
                      <div className="col-span-2 md:col-span-1 lg:col-span-1">
                        <span className="font-medium text-gray-500">Cliente:</span>
                        <p className="text-gray-900">{adicional.idCliente?.nombre}</p>
                      </div>
                      <div className="col-span-2 md:col-span-1 lg:col-span-1">
                        <span className="font-medium text-gray-500">Vigencia:</span>
                        <p className="text-gray-900 capitalize">
                          {formatMesAdicional(adicional.mesInicio)} -{" "}
                          {adicional.mesFin ? formatMesAdicional(adicional.mesFin) : "Indefinido"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 space-y-2 text-sm md:grid-cols-3">
                      <div className="col-span-2 md:col-span-1 lg:col-span-1">
                        <span className="font-medium text-gray-500">Precio Total:</span>
                        <p className="text-green-600">{priceFormat(Number(adicional.precioTotal))}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <ButtonAction
              onClick={() => {
                handleCreateLiquidacionMensual();
              }}
              disabled={
                (selectedOrders.length === 0 && selectedAdicionales.length === 0) ||
                isCreatingLiquidacionMensualPending
              }
              Icon={PlusIcon}
              label="Crear Liquidación"
            />
          </div>
        </div>
      ) : null}
    </Section>
  );
}
