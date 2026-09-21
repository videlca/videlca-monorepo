import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Section } from "../../../components/ui/dashboard/Section";
import { ButtonAction } from "../../../components/common/ButtonAction";
import {
  AlertCircleIcon,
  ChevronDownIcon,
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
import type { OrdenServicio } from "../../../api/types/orden-servicio";
import type { Adicional } from "../../../api/types/adicionales";

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

interface ClienteGrupo {
  clienteKey: string;
  clienteNombre: string;
  ordenes: OrdenServicio[];
  adicionales: Adicional[];
  total: number;
  totalAntesIva: number;
}

const ordenAntesIva = (orden: OrdenServicio) =>
  orden.detalles?.reduce(
    (acc, detalle) => acc + (Number(detalle.precioAntesIva) || 0),
    0,
  ) || 0;

const agruparPorCliente = (
  ordenes: OrdenServicio[],
  adicionales: Adicional[],
): ClienteGrupo[] => {
  const grupos = new Map<string, ClienteGrupo>();

  const obtenerGrupo = (
    clienteId: number | undefined,
    clienteNombre: string | undefined,
  ) => {
    const key =
      clienteId != null ? String(clienteId) : (clienteNombre ?? "sin-cliente");
    if (!grupos.has(key)) {
      grupos.set(key, {
        clienteKey: key,
        clienteNombre: clienteNombre || "Sin cliente",
        ordenes: [],
        adicionales: [],
        total: 0,
        totalAntesIva: 0,
      });
    }
    return grupos.get(key)!;
  };

  ordenes.forEach((orden) => {
    const cliente = orden.idLocacion?.idCliente || orden.idCliente;
    const grupo = obtenerGrupo(cliente?.idCliente, cliente?.nombre);
    grupo.ordenes.push(orden);
    grupo.total += Number(orden.precioTotal) || 0;
    grupo.totalAntesIva += ordenAntesIva(orden);
  });

  adicionales.forEach((adicional) => {
    const cliente = adicional.idCliente;
    const grupo = obtenerGrupo(cliente?.idCliente, cliente?.nombre);
    grupo.adicionales.push(adicional);
    grupo.total += Number(adicional.precioTotal) || 0;
    grupo.totalAntesIva += Number(adicional.precioAntesIva) || 0;
  });

  return Array.from(grupos.values()).sort((a, b) =>
    a.clienteNombre.localeCompare(b.clienteNombre),
  );
};

function RouteComponent() {
  const [searchMonth, setSearchMonth] = useState<string>(currentMonth);
  const [searchYear, setSearchYear] = useState<string>(currentYear);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [liquidandoClienteKey, setLiquidandoClienteKey] = useState<string | null>(
    null,
  );

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

  const clientesGrupos = agruparPorCliente(liquidacionesData, adicionalesData);

  const toggleExpandCliente = (clienteKey: string) => {
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(clienteKey)) {
        next.delete(clienteKey);
      } else {
        next.add(clienteKey);
      }
      return next;
    });
  };

  const handleLiquidarCliente = async (grupo: ClienteGrupo) => {
    if (grupo.ordenes.length === 0 && grupo.adicionales.length === 0) {
      toast.error("Este cliente no tiene órdenes ni adicionales por liquidar");
      return;
    }

    setLiquidandoClienteKey(grupo.clienteKey);
    await crearLiquidacionMensual(
      {
        anio: Number(searchYear),
        mes: Number(searchMonth),
        ordenIds: grupo.ordenes.map((orden) => orden.idOrdenServicio || 0),
        adicionalIds: grupo.adicionales.map((adicional) => adicional.idAdicional),
      },
      {
        onSettled: () => {
          setLiquidandoClienteKey(null);
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
                  setExpandedClients(new Set());
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
                  setExpandedClients(new Set());
                }}
                options={monthsOptions}
              />
            </div>
            <ButtonAction
              onClick={() => {
                setIsSearching(true);
                refetchLiquidaciones();
                refetchAdicionales();
                setExpandedClients(new Set());
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
        <div className="space-y-6 rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
          <div className="mb-2">
            <h2 className="text-xl font-semibold">
              Clientes ({clientesGrupos.length} {clientesGrupos.length === 1 ? "encontrado" : "encontrados"})
            </h2>
            <p className="text-sm text-gray-500">
              {liquidacionesData.length}{" "}
              {liquidacionesData.length === 1 ? "orden de servicio" : "órdenes de servicio"} y{" "}
              {adicionalesData.length}{" "}
              {adicionalesData.length === 1 ? "adicional" : "adicionales"} por liquidar
            </p>
          </div>

          <div className="space-y-8">
            {clientesGrupos.map((grupo) => {
              const isExpanded = expandedClients.has(grupo.clienteKey);
              const isLiquidandoEsteCliente =
                isCreatingLiquidacionMensualPending &&
                liquidandoClienteKey === grupo.clienteKey;

              return (
                <div
                  key={grupo.clienteKey}
                  className="rounded-lg border border-gray-300 bg-white"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 p-3">
                    <button
                      type="button"
                      onClick={() => toggleExpandCliente(grupo.clienteKey)}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
                    >
                      <ChevronDownIcon
                        className={`h-4 w-4 flex-shrink-0 text-gray-500 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-gray-900 text-lg">
                          {grupo.clienteNombre}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {grupo.ordenes.length}{" "}
                          {grupo.ordenes.length === 1 ? "orden" : "órdenes"} ·{" "}
                          {grupo.adicionales.length}{" "}
                          {grupo.adicionales.length === 1 ? "adicional" : "adicionales"}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-4">
                      {/* <div className="text-right text-xs whitespace-nowrap">
                        <p className="text-gray-500">
                          Antes de IVA:{" "}
                          <span className="font-medium text-gray-700">
                            {priceFormat(grupo.totalAntesIva)}
                          </span>
                        </p>
                        <p className="text-gray-500">
                          Total:{" "}
                          <span className="text-sm font-semibold text-green-600">
                            {priceFormat(grupo.total)}
                          </span>
                        </p>
                      </div> */}
                      <ButtonAction
                        onClick={() => handleLiquidarCliente(grupo)}
                        disabled={isCreatingLiquidacionMensualPending}
                        Icon={PlusIcon}
                        label={isLiquidandoEsteCliente ? "Liquidando..." : "Liquidar Cliente"}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="grid grid-cols-1 gap-2 border-t border-gray-200 p-3 md:grid-cols-2 xl:grid-cols-3">
                      {grupo.ordenes.map((orden) => (
                        <div
                          key={orden.idOrdenServicio}
                          className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium text-gray-900">
                              {orden.ordenServicioId?.descripcionId}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap capitalize ${getStatusColor(orden.idEstadoOrdenServicio?.nombre || "")}`}
                            >
                              {orden.idEstadoOrdenServicio?.nombre}
                            </span>
                          </div>
                          {orden.idLocacion && (
                            <p className="mt-1 truncate text-gray-600">
                              {orden.idLocacion.nombre} - {orden.idLocacion.direccion}
                            </p>
                          )}
                          <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-gray-500">
                            <span>
                              {orden.fechaInicio || ""} → {orden.fechaFin || "Indefinida"}
                            </span>
                            {/* <span className="font-medium text-green-600">
                              {priceFormat(Number(orden.precioTotal))}
                            </span> */}
                          </div>
                        </div>
                      ))}

                      {grupo.adicionales.map((adicional) => (
                        <div
                          key={adicional.idAdicional}
                          className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium text-gray-900">
                              {adicional.nombre}
                            </span>
                            <span className="rounded-full border border-gray-300 bg-gray-100 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-gray-600">
                              Adicional
                            </span>
                          </div>
                          <p className="mt-1 text-gray-600 capitalize">
                            {formatMesAdicional(adicional.mesInicio)} -{" "}
                            {adicional.mesFin
                              ? formatMesAdicional(adicional.mesFin)
                              : "Indefinido"}
                          </p>
                          {/* <div className="mt-1 flex justify-end text-gray-500">
                            <span className="font-medium text-green-600">
                              {priceFormat(Number(adicional.precioTotal))}
                            </span>
                          </div> */}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </Section>
  );
}
