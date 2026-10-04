import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import Table from "../../../components/common/Table";
import {
  useComparativaPeriodos,
  usePeriodos,
} from "../../../api/queryFunctions/tarifas/periodo";
import { useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  MinusIcon,
  BarChart3,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type {
  ComparativaCambioPrecio,
  ComparativaOrdenes,
  ComparativaServicio,
} from "../../../api/types/periodo";

export const Route = createFileRoute(
  "/dashboard/tarifas/comparativa-periodos",
)({
  component: RouteComponent,
});

// ─── Helpers ───────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);

const DiffBadge = ({ value }: { value: number }) => {
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
        <ArrowUpIcon className="h-3 w-3" />+{value}
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
        <ArrowDownIcon className="h-3 w-3" />
        {value}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
      <MinusIcon className="h-3 w-3" />0
    </span>
  );
};

const DiffCurrencyBadge = ({ value }: { value: number }) => {
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
        <ArrowUpIcon className="h-3 w-3" />+{formatCurrency(value)}
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
        <ArrowDownIcon className="h-3 w-3" />
        {formatCurrency(value)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
      <MinusIcon className="h-3 w-3" />
      {formatCurrency(0)}
    </span>
  );
};

// ─── Columns ───────────────────────────────────────────────

const columnsNuevos: ColumnDef<ComparativaServicio>[] = [
  {
    header: "Servicio",
    accessorKey: "nombreServicio",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.nombreServicio}</span>
    ),
  },
  {
    header: "Precio",
    accessorKey: "precio",
    cell: ({ row }) => formatCurrency(row.original.precio),
  },
  {
    header: "Órdenes",
    accessorKey: "cantidadOrdenes",
  },
];

const columnsEliminados: ColumnDef<ComparativaServicio>[] = [
  {
    header: "Servicio",
    accessorKey: "nombreServicio",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.nombreServicio}</span>
    ),
  },
  {
    header: "Precio",
    accessorKey: "precio",
    cell: ({ row }) => formatCurrency(row.original.precio),
  },
  {
    header: "Órdenes",
    accessorKey: "cantidadOrdenes",
  },
];

const columnsCambioPrecio: ColumnDef<ComparativaCambioPrecio>[] = [
  {
    header: "Servicio",
    accessorKey: "nombreServicio",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.nombreServicio}</span>
    ),
  },
  {
    header: "Precio anterior",
    accessorKey: "precioAnterior",
    cell: ({ row }) => formatCurrency(row.original.precioAnterior),
  },
  {
    header: "Precio nuevo",
    accessorKey: "precioNuevo",
    cell: ({ row }) => formatCurrency(row.original.precioNuevo),
  },
  {
    header: "Diferencia",
    accessorKey: "diferencia",
    cell: ({ row }) => <DiffCurrencyBadge value={row.original.diferencia} />,
  },
];

const columnsOrdenes: ColumnDef<ComparativaOrdenes>[] = [
  {
    header: "Servicio",
    accessorKey: "nombreServicio",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.nombreServicio}</span>
    ),
  },
  {
    header: "Órdenes Periodo A",
    cell: ({ row }) => row.original.periodoA.cantidadOrdenes,
  },
  {
    header: "Órdenes Periodo B",
    cell: ({ row }) => row.original.periodoB.cantidadOrdenes,
  },
  {
    header: "Diferencia",
    accessorKey: "diferencia",
    cell: ({ row }) => <DiffBadge value={row.original.diferencia} />,
  },
];

// ─── Page ──────────────────────────────────────────────────

function RouteComponent() {
  const [selectedPeriodoA, setSelectedPeriodoA] = useState<number | null>(null);
  const [selectedPeriodoB, setSelectedPeriodoB] = useState<number | null>(null);

  const { data: periodosData } = usePeriodos();
  const {
    data: comparativaData,
    isLoading,
    isFetching,
  } = useComparativaPeriodos(selectedPeriodoA, selectedPeriodoB);

  const periodos = periodosData?.data?.data || [];
  const comparativa = comparativaData?.data;

  const canCompare =
    selectedPeriodoA &&
    selectedPeriodoB &&
    selectedPeriodoA !== selectedPeriodoB;
  const isSamePeriodo =
    selectedPeriodoA &&
    selectedPeriodoB &&
    selectedPeriodoA === selectedPeriodoB;

  return (
    <Section>
      <div className="flex flex-col gap-8">
        {/* ─── Header ─── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Comparativa de Periodos
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Selecciona dos periodos de facturación para comparar servicios,
            precios y órdenes.
          </p>
        </div>

        {/* ─── Selectors ─── */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Periodo A */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="periodoA"
                className="text-sm font-medium text-gray-700"
              >
                Periodo A (base)
              </label>
              <select
                id="periodoA"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
                value={selectedPeriodoA ?? 0}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSelectedPeriodoA(val === 0 ? null : val);
                }}
              >
                <option value={0} disabled hidden>
                  Seleccionar periodo base...
                </option>
                {periodos.map((p) => (
                  <option key={p.idPeriodo} value={p.idPeriodo}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Periodo B */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="periodoB"
                className="text-sm font-medium text-gray-700"
              >
                Periodo B (comparar)
              </label>
              <select
                id="periodoB"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
                value={selectedPeriodoB ?? 0}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSelectedPeriodoB(val === 0 ? null : val);
                }}
              >
                <option value={0} disabled hidden>
                  Seleccionar periodo a comparar...
                </option>
                {periodos.map((p) => (
                  <option key={p.idPeriodo} value={p.idPeriodo}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isSamePeriodo && (
            <p className="mt-3 text-sm font-medium text-red-500">
              Los periodos seleccionados no pueden ser el mismo.
            </p>
          )}
        </div>

        {/* ─── Loading ─── */}
        {canCompare && (isLoading || isFetching) && (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="text-sm">Cargando comparativa...</span>
          </div>
        )}

        {/* ─── Results ─── */}
        {comparativa && !isLoading && (
          <>
            {/* ─── Period Info ─── */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Periodo A
                </p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {comparativa.periodoA.nombre}
                </p>
                <p className="text-sm text-gray-500">
                  {comparativa.periodoA.fechaInicio} →{" "}
                  {comparativa.periodoA.fechaFin}
                </p>
              </div>
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                  Periodo B
                </p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {comparativa.periodoB.nombre}
                </p>
                <p className="text-sm text-gray-500">
                  {comparativa.periodoB.fechaInicio} →{" "}
                  {comparativa.periodoB.fechaFin}
                </p>
              </div>
            </div>

            {/* ─── Summary Cards ─── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Servicios A */}
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Servicios A
                  </p>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {comparativa.resumen.cantidadServicios.periodoA}
                </p>
              </div>

              {/* Servicios B */}
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Servicios B
                  </p>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {comparativa.resumen.cantidadServicios.periodoB}
                </p>
                <div className="mt-1">
                  <DiffBadge
                    value={comparativa.resumen.cantidadServicios.diferencia}
                  />
                </div>
              </div>

              {/* Valor Total A */}
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Valor Total A
                  </p>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    comparativa.resumen.valorTotalTarifas.periodoA,
                  )}
                </p>
              </div>

              {/* Valor Total B */}
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-purple-500" />
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Valor Total B
                  </p>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    comparativa.resumen.valorTotalTarifas.periodoB,
                  )}
                </p>
                <div className="mt-1">
                  <DiffCurrencyBadge
                    value={comparativa.resumen.valorTotalTarifas.diferencia}
                  />
                </div>
              </div>
            </div>

            {/* ─── Servicios Nuevos ─── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  Servicios nuevos
                </h2>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  {comparativa.comparativa.serviciosNuevos.length}
                </span>
              </div>
              {comparativa.comparativa.serviciosNuevos.length > 0 ? (
                <Table
                  data={comparativa.comparativa.serviciosNuevos}
                  columns={columnsNuevos}
                  pageSize={5}
                  enableFiltering={false}
                  enableSorting={false}
                  enablePagination={
                    comparativa.comparativa.serviciosNuevos.length > 5
                  }
                  emptyMessage="No hay servicios nuevos"
                />
              ) : (
                <p className="rounded-lg border border-dashed border-gray-300 py-6 text-center text-sm text-gray-400">
                  No hay servicios nuevos en el Periodo B.
                </p>
              )}
            </div>

            {/* ─── Servicios Eliminados ─── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  Servicios eliminados
                </h2>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  {comparativa.comparativa.serviciosEliminados.length}
                </span>
              </div>
              {comparativa.comparativa.serviciosEliminados.length > 0 ? (
                <Table
                  data={comparativa.comparativa.serviciosEliminados}
                  columns={columnsEliminados}
                  pageSize={5}
                  enableFiltering={false}
                  enableSorting={false}
                  enablePagination={
                    comparativa.comparativa.serviciosEliminados.length > 5
                  }
                  emptyMessage="No hay servicios eliminados"
                />
              ) : (
                <p className="rounded-lg border border-dashed border-gray-300 py-6 text-center text-sm text-gray-400">
                  No hay servicios eliminados del Periodo A.
                </p>
              )}
            </div>

            {/* ─── Cambios de Precio ─── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  Cambios de precio
                </h2>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  {comparativa.comparativa.serviciosConCambioPrecio.length}
                </span>
              </div>
              {comparativa.comparativa.serviciosConCambioPrecio.length > 0 ? (
                <Table
                  data={comparativa.comparativa.serviciosConCambioPrecio}
                  columns={columnsCambioPrecio}
                  pageSize={5}
                  enableFiltering={false}
                  enableSorting={false}
                  enablePagination={
                    comparativa.comparativa.serviciosConCambioPrecio.length > 5
                  }
                  emptyMessage="No hay cambios de precio"
                />
              ) : (
                <p className="rounded-lg border border-dashed border-gray-300 py-6 text-center text-sm text-gray-400">
                  No hay cambios de precio entre los periodos.
                </p>
              )}
            </div>

            {/* ─── Órdenes por Servicio ─── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  Órdenes por servicio
                </h2>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {comparativa.comparativa.ordenesPorServicio.length}
                </span>
              </div>
              {comparativa.comparativa.ordenesPorServicio.length > 0 ? (
                <Table
                  data={comparativa.comparativa.ordenesPorServicio}
                  columns={columnsOrdenes}
                  pageSize={10}
                  enableFiltering={true}
                  enableSorting={false}
                  enablePagination={
                    comparativa.comparativa.ordenesPorServicio.length > 10
                  }
                  emptyMessage="No hay órdenes para comparar"
                />
              ) : (
                <p className="rounded-lg border border-dashed border-gray-300 py-6 text-center text-sm text-gray-400">
                  No hay órdenes registradas en ninguno de los periodos.
                </p>
              )}
            </div>
          </>
        )}

        {/* ─── Empty State ─── */}
        {!canCompare && !isSamePeriodo && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
            <BarChart3 className="h-12 w-12" />
            <p className="text-sm">
              Selecciona dos periodos diferentes para ver la comparativa.
            </p>
          </div>
        )}
      </div>
    </Section>
  );
}
