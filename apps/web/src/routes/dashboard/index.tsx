import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  Wrench,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useGetDashboardInicio } from "../../api/queryFunctions/orden-servicio/dashboard";
import type { MonthsAvailable } from "../../api/dtos";

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
  notFoundComponent: () => <div>Not Found</div>,
});

const MESES_OPTIONS: { label: string; value: MonthsAvailable }[] = [
  { label: "Mes actual", value: 0 },
  { label: "3 meses", value: 3 },
  { label: "6 meses", value: 6 },
  { label: "12 meses", value: 12 },
];

const COLORES_ESTADO: Record<string, string> = {
  INICIADO: "#3B82F6",     // Blue
  TERMINADO: "#10B981",    // Emerald Green
  PROGRAMADO: "#F59E0B",   // Amber / Orange
  POR_INICIAR: "#8B5CF6",  // Purple
  POR_TERMINAR: "#EAB308", // Yellow
  CANCELADA: "#EF4444",    // Red
  ANULADA: "#6B7280",      // Slate Gray
};

const LABEL_ESTADO: Record<string, string> = {
  INICIADO: "Iniciado",
  TERMINADO: "Terminado",
  PROGRAMADO: "Programado",
  POR_INICIAR: "Por Iniciar",
  POR_TERMINAR: "Por Terminar",
  CANCELADA: "Cancelada",
  ANULADA: "Anulada",
};

const FALLBACK_PALETTE = [
  "#3B82F6", // Blue
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#6366F1", // Indigo
];

function normalizeKey(rawName: string): string {
  if (!rawName) return "";
  return rawName.trim().toUpperCase().replace(/\s+/g, "_");
}

function getColorForEstado(rawName: string, index: number = 0): string {
  const normalized = normalizeKey(rawName);
  if (COLORES_ESTADO[normalized]) {
    return COLORES_ESTADO[normalized];
  }
  return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

function getLabelForEstado(rawName: string): string {
  if (!rawName) return "";
  const normalized = normalizeKey(rawName);
  if (LABEL_ESTADO[normalized]) {
    return LABEL_ESTADO[normalized];
  }
  return rawName
    .split(/[\s_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function RouteComponent() {
  const [selectedPeriod, setSelectedPeriod] = useState<MonthsAvailable>(0);

  const { data: response, isLoading } = useGetDashboardInicio({
    months: selectedPeriod,
  });

  const data = response?.data;

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("es-CO").format(value);
  };

  // --- Datos para la dona ---
  const dataDona = data
    ? Object.entries(data.distribucionEstados).map(([name, value]) => ({
        name: getLabelForEstado(name),
        rawName: name,
        value,
      }))
    : [];

  // --- Datos para barras por mes (stacked) ---
  const estados = data
    ? [...new Set(Object.values(data.ordenesPorMes).flatMap(Object.keys))]
    : [];

  const dataBarras = data
    ? Object.entries(data.ordenesPorMes).map(([mes, estadosMap]) => ({
        mes: mes.charAt(0).toUpperCase() + mes.slice(1),
        ...estadosMap,
      }))
    : [];

  // --- Cálculos ---
  const totalOrdenes = data?.totales.totalOrdenes ?? 0;
  const ordenesTerminadas = data?.totales.ordenesTerminadas ?? 0;
  const tasaCompletacion =
    totalOrdenes > 0 ? Math.round((ordenesTerminadas / totalOrdenes) * 100) : 0;

  return (
    <div className="h-full space-y-6 overflow-y-auto p-6 bg-gray-50/50">
      {/* Page Header — Selector de período */}
      <div className="flex flex-col space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Calendar size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Período de Reporte</h2>
            <p className="text-xs text-gray-500">Selecciona el rango para los indicadores</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) =>
              setSelectedPeriod(Number(e.target.value) as MonthsAvailable)
            }
            className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {MESES_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {data?.rango && (
            <span className="hidden rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 sm:inline-block">
              {new Date(data.rango.from).toLocaleDateString("es-CO")} —{" "}
              {new Date(data.rango.to).toLocaleDateString("es-CO")}
            </span>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={36} className="animate-spin text-blue-600" />
          <span className="ml-3 text-sm font-medium text-gray-500">Cargando reportes…</span>
        </div>
      )}

      {!isLoading && data && (
        <>
          {/* Métricas Principales */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Total Órdenes */}
            <div className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Órdenes</p>
                  <p className="mt-1 text-3xl font-extrabold text-gray-900">
                    {formatNumber(totalOrdenes)}
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 transition-colors group-hover:bg-blue-100">
                  <FileText size={26} className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Órdenes Terminadas */}
            <div className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Órdenes Terminadas</p>
                  <p className="mt-1 text-3xl font-extrabold text-gray-900">
                    {formatNumber(ordenesTerminadas)}
                  </p>
                  <p className="mt-2 inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <CheckCircle2 size={13} className="mr-1" />
                    {tasaCompletacion}% tasa de completación
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 transition-colors group-hover:bg-emerald-100">
                  <CheckCircle2 size={26} className="text-emerald-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos Principales */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Gráfico de Órdenes por Mes — Stacked */}
            {dataBarras.length > 0 && (
              <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <BarChart3 size={20} className="text-blue-600" />
                    <h3 className="text-base font-semibold text-gray-900">
                      Órdenes por Mes
                    </h3>
                  </div>
                </div>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataBarras} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis
                        dataKey="mes"
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatNumber(value),
                          getLabelForEstado(name),
                        ]}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          border: '1px solid #E5E7EB',
                          fontSize: '13px',
                        }}
                      />
                      <Legend
                        formatter={(value: string) => getLabelForEstado(value)}
                        wrapperStyle={{ paddingTop: '12px', fontSize: '13px' }}
                      />
                      {estados.map((estado, idx) => (
                        <Bar
                          key={estado}
                          dataKey={estado}
                          name={getLabelForEstado(estado)}
                          stackId="a"
                          fill={getColorForEstado(estado, idx)}
                          radius={[idx === estados.length - 1 ? 4 : 0, idx === estados.length - 1 ? 4 : 0, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Gráfico de Distribución por Estado — Dona */}
            {dataDona.length > 0 && (
              <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <PieChartIcon size={20} className="text-purple-600" />
                    <h3 className="text-base font-semibold text-gray-900">
                      Distribución por Estado
                    </h3>
                  </div>
                </div>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataDona}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={105}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                      >
                        {dataDona.map((entry, idx) => (
                          <Cell
                            key={entry.rawName}
                            fill={getColorForEstado(entry.rawName, idx)}
                            stroke="#FFFFFF"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          formatNumber(value as number),
                          "Órdenes",
                        ]}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          border: '1px solid #E5E7EB',
                          fontSize: '13px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Leyenda manual */}
                <div className="mt-3 flex flex-wrap justify-center gap-2.5">
                  {dataDona.map((item, idx) => (
                    <div
                      key={item.rawName}
                      className="flex items-center space-x-2 rounded-lg bg-gray-50/80 px-3 py-1.5 border border-gray-100 shadow-2xs"
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full shadow-xs"
                        style={{
                          backgroundColor: getColorForEstado(item.rawName, idx),
                        }}
                      />
                      <span className="text-xs font-medium text-gray-700">
                        {item.name} <span className="font-semibold text-gray-900">({item.value})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top Servicios y Top Clientes */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top Servicios */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="mb-4 flex items-center space-x-2 border-b border-gray-100 pb-3">
                <Wrench size={20} className="text-blue-600" />
                <h3 className="text-base font-semibold text-gray-900">
                  Top Servicios
                </h3>
              </div>
              <div className="space-y-3">
                {data.topServicios.length === 0 && (
                  <p className="text-sm text-gray-400 italic">Sin datos registrados</p>
                )}
                {data.topServicios.map((item, index) => {
                  const maxTotal = data.topServicios[0]?.total || 1;
                  const pct = Math.round((item.total / maxTotal) * 100);
                  return (
                    <div
                      key={item.nombre}
                      className="relative overflow-hidden rounded-lg border border-gray-100 bg-gray-50/60 p-3"
                    >
                      {/* Barra de progreso de fondo */}
                      <div
                        className="absolute inset-y-0 left-0 bg-blue-100/60 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative flex items-center justify-between">
                        <div className="mr-4 min-w-0 flex-1">
                          <h4 className="truncate text-sm font-medium text-gray-900">
                            <span className="mr-1.5 font-bold text-blue-600">#{index + 1}</span> {item.nombre}
                          </h4>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm font-bold text-gray-900">
                            {item.total}
                          </p>
                          <p className="text-[11px] text-gray-500">órdenes</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Clientes */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="mb-4 flex items-center space-x-2 border-b border-gray-100 pb-3">
                <Building2 size={20} className="text-indigo-600" />
                <h3 className="text-base font-semibold text-gray-900">
                  Top Clientes
                </h3>
              </div>
              <div className="space-y-3">
                {data.topClientes.length === 0 && (
                  <p className="text-sm text-gray-400 italic">Sin datos registrados</p>
                )}
                {data.topClientes.map((item, index) => {
                  const maxTotal = data.topClientes[0]?.total || 1;
                  const pct = Math.round((item.total / maxTotal) * 100);
                  return (
                    <div
                      key={item.nombre}
                      className="relative overflow-hidden rounded-lg border border-gray-100 bg-gray-50/60 p-3"
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-indigo-100/60 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative flex items-center justify-between">
                        <div className="mr-4 flex min-w-0 flex-1 items-center space-x-2.5">
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                            #{index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-medium text-gray-900">
                              {item.nombre}
                            </h4>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm font-bold text-gray-900">
                            {item.total}
                          </p>
                          <p className="text-[11px] text-gray-500">órdenes</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

