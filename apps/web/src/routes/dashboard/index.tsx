import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Building2,
  CheckCircle,
  FileText,
  Loader2,
  TrendingUp,
  Wrench,
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
  INICIADO: "#3B82F6",
  TERMINADO: "#10B981",
  PROGRAMADO: "#F59E0B",
  POR_INICIAR: "#8B5CF6",
  POR_TERMINAR: "#EF4444",
  CANCELADA: "#6B7280",
  ANULADA: "#DC2626",
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
        name: LABEL_ESTADO[name] || name,
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
    <div className="h-full space-y-6 overflow-y-auto p-6">
      {/* Page Header — Selector de período */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) =>
              setSelectedPeriod(Number(e.target.value) as MonthsAvailable)
            }
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          >
            {MESES_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {data?.rango && (
          <p className="text-sm text-gray-500">
            {new Date(data.rango.from).toLocaleDateString("es-CO")} —{" "}
            {new Date(data.rango.to).toLocaleDateString("es-CO")}
          </p>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <span className="ml-3 text-gray-500">Cargando reportes…</span>
        </div>
      )}

      {!isLoading && data && (
        <>
          {/* Métricas Principales */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Total Órdenes */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Órdenes
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatNumber(totalOrdenes)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <FileText size={24} className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Órdenes Terminadas */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Órdenes Terminadas
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatNumber(ordenesTerminadas)}
                  </p>
                  <p className="mt-1 text-sm text-green-600">
                    <CheckCircle size={14} className="mr-1 inline" />
                    {tasaCompletacion}% tasa de completación
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos Principales */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
            {/* Gráfico de Órdenes por Mes — Stacked */}
            {dataBarras.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Órdenes por Mes
                </h3>
                <div className="h-[300px] min-h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataBarras}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Legend
                        formatter={(value: string) =>
                          LABEL_ESTADO[value] || value
                        }
                      />
                      {estados.map((estado) => (
                        <Bar
                          key={estado}
                          dataKey={estado}
                          stackId="a"
                          fill={COLORES_ESTADO[estado] || "#999"}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Gráfico de Distribución por Estado — Dona */}
            {dataDona.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Distribución por Estado
                </h3>
                <div className="h-[300px] min-h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataDona}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                      >
                        {dataDona.map((entry) => (
                          <Cell
                            key={entry.rawName}
                            fill={
                              COLORES_ESTADO[entry.rawName] || "#999"
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          formatNumber(value as number),
                          "Órdenes",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Leyenda manual */}
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {dataDona.map((item) => (
                    <div
                      key={item.rawName}
                      className="flex items-center space-x-2"
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            COLORES_ESTADO[item.rawName] || "#999",
                        }}
                      />
                      <span className="text-sm text-gray-600">
                        {item.name} ({item.value})
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
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center space-x-2">
                <Wrench size={20} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Top Servicios
                </h3>
              </div>
              <div className="space-y-3">
                {data.topServicios.length === 0 && (
                  <p className="text-sm text-gray-400">Sin datos</p>
                )}
                {data.topServicios.map((item, index) => {
                  const maxTotal = data.topServicios[0]?.total || 1;
                  const pct = Math.round((item.total / maxTotal) * 100);
                  return (
                    <div
                      key={item.nombre}
                      className="relative overflow-hidden rounded-lg bg-gray-50 p-3"
                    >
                      {/* Barra de progreso de fondo */}
                      <div
                        className="absolute inset-y-0 left-0 bg-blue-100"
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative flex items-center justify-between">
                        <div className="mr-4 min-w-0 flex-1">
                          <h4 className="truncate font-medium text-gray-900">
                            {index + 1}. {item.nombre}
                          </h4>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="font-semibold text-gray-900">
                            {item.total}
                          </p>
                          <p className="text-xs text-gray-500">órdenes</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Clientes */}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center space-x-2">
                <Building2 size={20} className="text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Top Clientes
                </h3>
              </div>
              <div className="space-y-3">
                {data.topClientes.length === 0 && (
                  <p className="text-sm text-gray-400">Sin datos</p>
                )}
                {data.topClientes.map((item, index) => {
                  const maxTotal = data.topClientes[0]?.total || 1;
                  const pct = Math.round((item.total / maxTotal) * 100);
                  return (
                    <div
                      key={item.nombre}
                      className="relative overflow-hidden rounded-lg bg-gray-50 p-3"
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-indigo-100"
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative flex items-center justify-between">
                        <div className="mr-4 flex min-w-0 flex-1 items-center space-x-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
                            <Building2 size={16} className="text-indigo-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate font-medium text-gray-900">
                              {index + 1}. {item.nombre}
                            </h4>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="font-semibold text-gray-900">
                            {item.total}
                          </p>
                          <p className="text-xs text-gray-500">órdenes</p>
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
