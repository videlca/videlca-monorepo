import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertCircle,
  BarChart as BarChartIcon,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
  notFoundComponent: () => <div>Not Found</div>,
});

const ordenesData = [
  {
    mes: "Ene",
    generadas: 45,
    liquidadas: 38,
    completadas: 35,
    porLiquidar: 7,
  },
  {
    mes: "Feb",
    generadas: 52,
    liquidadas: 41,
    completadas: 39,
    porLiquidar: 11,
  },
  {
    mes: "Mar",
    generadas: 48,
    liquidadas: 44,
    completadas: 42,
    porLiquidar: 4,
  },
  {
    mes: "Abr",
    generadas: 61,
    liquidadas: 55,
    completadas: 53,
    porLiquidar: 6,
  },
  {
    mes: "May",
    generadas: 55,
    liquidadas: 48,
    completadas: 46,
    porLiquidar: 7,
  },
  {
    mes: "Jun",
    generadas: 67,
    liquidadas: 59,
    completadas: 57,
    porLiquidar: 8,
  },
];

const ingresosMensuales = [
  { mes: "Ene", ingresos: 15600000, proyectado: 16000000 },
  { mes: "Feb", ingresos: 18200000, proyectado: 17500000 },
  { mes: "Mar", ingresos: 17800000, proyectado: 18000000 },
  { mes: "Abr", ingresos: 21400000, proyectado: 20000000 },
  { mes: "May", ingresos: 19600000, proyectado: 19000000 },
  { mes: "Jun", ingresos: 23100000, proyectado: 22000000 },
];

const estadosOrdenes = [
  { name: "Completadas", value: 342, color: "#10B981" },
  { name: "Activas", value: 89, color: "#3B82F6" },
  { name: "Pendientes", value: 43, color: "#F59E0B" },
  { name: "Canceladas", value: 12, color: "#EF4444" },
];

const serviciosMasUsados = [
  { servicio: "Control de Acceso 24/7", ordenes: 156, ingresos: 23400000 },
  { servicio: "Videovigilancia Remota", ordenes: 89, ingresos: 17800000 },
  { servicio: "Patrullaje Perimetral", ordenes: 67, ingresos: 8040000 },
  { servicio: "Supervisión de Seguridad", ordenes: 45, ingresos: 8100000 },
  { servicio: "Seguridad para Eventos", ordenes: 29, ingresos: 14500000 },
];

const clientesTop = [
  { cliente: "Inversiones Plaza S.A.S", ordenes: 34, valor: 5100000 },
  { cliente: "Corporación Norte Ltda", ordenes: 28, valor: 4200000 },
  { cliente: "Administración Los Pinos", ordenes: 22, valor: 2640000 },
  { cliente: "Eventos & Convenciones S.A.S", ordenes: 18, valor: 9000000 },
  { cliente: "Centro Comercial Andino", ordenes: 15, valor: 2250000 },
];

function RouteComponent() {
  const [selectedPeriod, setSelectedPeriod] = useState("6-meses");
  const [selectedMetric, setSelectedMetric] = useState("ordenes");
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("es-CO").format(value);
  };

  const totalOrdenes = estadosOrdenes.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const totalIngresos = ingresosMensuales.reduce(
    (sum, item) => sum + item.ingresos,
    0,
  );
  const promedioMensual = Math.round(totalIngresos / ingresosMensuales.length);
  const ordenesCompletadas =
    estadosOrdenes.find((item) => item.name === "Completadas")?.value || 0;
  const tasaCompletacion = Math.round(
    (ordenesCompletadas / totalOrdenes) * 100,
  );

  const exportReport = () => {
    // Simular exportación
  };

  return (
    <div className="h-full space-y-6 overflow-y-auto p-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          >
            <option value="1-mes">Último mes</option>
            <option value="3-meses">Últimos 3 meses</option>
            <option value="6-meses">Últimos 6 meses</option>
            <option value="1-año">Último año</option>
          </select>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Órdenes</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(totalOrdenes)}
              </p>
              <p className="mt-1 text-sm text-green-600">
                <TrendingUp size={14} className="mr-1 inline" />
                +12% vs mes anterior
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <FileText size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Órdenes Completadas
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(ordenesCompletadas)}
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

        {/* <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Ingresos Totales
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(totalIngresos)}
              </p>
              <p className="mt-1 text-sm text-green-600">
                <TrendingUp size={14} className="mr-1 inline" />
                +8% vs período anterior
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <DollarSign size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Promedio Mensual
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(promedioMensual)}
              </p>
              <p className="mt-1 text-sm text-blue-600">
                <Calendar size={14} className="mr-1 inline" />
                Últimos 6 meses
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
              <BarChartIcon size={24} className="text-orange-600" />
            </div>
          </div>
        </div> */}
      </div>

      {/* Gráficos Principales */}
      <div className="lg:grid-col-3 grid grid-cols-1 gap-6">
        {/* Gráfico de Órdenes por Mes */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <h3 className="text-lg font-semibold text-gray-900">
              Órdenes por Mes
            </h3>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 sm:w-auto"
            >
              <option value="ordenes">Órdenes</option>
              <option value="ingresos">Ingresos</option>
            </select>
          </div>
          <div className="h-[300px] min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordenesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="generadas" fill="#3B82F6" name="Generadas" />
                <Bar dataKey="liquidadas" fill="#10B981" name="Liquidadas" />
                <Bar dataKey="completadas" fill="#8B5CF6" name="Completadas" />
                <Bar dataKey="porLiquidar" fill="#F59E0B" name="Por Liquidar" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Estados */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Distribución por Estado
          </h3>
          <div className="h-[300px] min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={estadosOrdenes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {estadosOrdenes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {estadosOrdenes.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tablas de Análisis */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Servicios Más Utilizados */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Servicios Más Utilizados
          </h3>
          <div className="space-y-4">
            {serviciosMasUsados.map((servicio, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
              >
                <div className="mr-4 min-w-0 flex-1">
                  <h4 className="truncate font-medium text-gray-900">
                    {servicio.servicio}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {servicio.ordenes} órdenes
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(servicio.ingresos)}
                  </p>
                  <p className="text-sm text-gray-600">Ingresos</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Clientes */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Top Clientes
          </h3>
          <div className="space-y-4">
            {clientesTop.map((cliente, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
              >
                <div className="mr-4 flex min-w-0 flex-1 items-center space-x-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Building2 size={16} className="text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-medium text-gray-900">
                      {cliente.cliente}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {cliente.ordenes} órdenes
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(cliente.valor)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Métricas Adicionales */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              <Users size={20} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Personal Activo</h3>
              <p className="text-sm text-gray-600">En órdenes actuales</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">156</p>
          <p className="mt-1 text-sm text-blue-600">89% de capacidad</p>
        </div>
      </div>
    </div>
  );
}
