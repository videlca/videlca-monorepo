import { createFileRoute } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useState, type ReactNode } from "react";
import BarChartIcon from "@mui/icons-material/BarChart";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PieChartOutlinedIcon from "@mui/icons-material/PieChartOutlined";
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
    <div className="flex h-full flex-col gap-6 overflow-y-auto">
      {/* Page Header — Selector de período */}
      <Paper variant="outlined" className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <IconBadge color="primary">
            <CalendarMonthOutlinedIcon fontSize="small" />
          </IconBadge>
          <div>
            <Typography variant="h5" component="h2">
              Período de Reporte
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Selecciona el rango para los indicadores
            </Typography>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <TextField
            select
            value={selectedPeriod}
            onChange={(e) =>
              setSelectedPeriod(Number(e.target.value) as MonthsAvailable)
            }
            fullWidth={false}
            sx={{ minWidth: 160 }}
          >
            {MESES_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          {data?.rango && (
            <Chip
              className="hidden sm:inline-flex"
              label={`${new Date(data.rango.from).toLocaleDateString("es-CO")} — ${new Date(data.rango.to).toLocaleDateString("es-CO")}`}
            />
          )}
        </div>
      </Paper>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-24">
          <CircularProgress />
          <Typography color="text.secondary">Cargando reportes…</Typography>
        </div>
      )}

      {!isLoading && data && (
        <>
          {/* Métricas Principales */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <KpiCard
              label="Total Órdenes"
              value={formatNumber(totalOrdenes)}
              icon={<DescriptionOutlinedIcon />}
              color="primary"
            />
            <KpiCard
              label="Órdenes Terminadas"
              value={formatNumber(ordenesTerminadas)}
              icon={<CheckCircleOutlinedIcon />}
              color="success"
              footer={
                <Chip
                  size="small"
                  color="success"
                  variant="outlined"
                  icon={<CheckCircleOutlinedIcon />}
                  label={`${tasaCompletacion}% tasa de completación`}
                />
              }
            />
          </div>

          {/* Gráficos Principales */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Gráfico de Órdenes por Mes — Stacked */}
            {dataBarras.length > 0 && (
              <DashboardCard title="Órdenes por Mes" icon={<BarChartIcon color="primary" />}>
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
                        contentStyle={CHART_TOOLTIP_STYLE}
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
              </DashboardCard>
            )}

            {/* Gráfico de Distribución por Estado — Dona */}
            {dataDona.length > 0 && (
              <DashboardCard
                title="Distribución por Estado"
                icon={<PieChartOutlinedIcon color="primary" />}
              >
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
                        contentStyle={CHART_TOOLTIP_STYLE}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Leyenda manual */}
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {dataDona.map((item, idx) => (
                    <Chip
                      key={item.rawName}
                      variant="outlined"
                      size="small"
                      icon={
                        <Box
                          component="span"
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: getColorForEstado(item.rawName, idx),
                          }}
                        />
                      }
                      label={`${item.name} (${item.value})`}
                    />
                  ))}
                </div>
              </DashboardCard>
            )}
          </div>

          {/* Top Servicios y Top Clientes */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardCard title="Top Servicios" icon={<BuildOutlinedIcon color="primary" />}>
              <RankingList items={data.topServicios} />
            </DashboardCard>
            <DashboardCard title="Top Clientes" icon={<BusinessOutlinedIcon color="primary" />}>
              <RankingList items={data.topClientes} />
            </DashboardCard>
          </div>
        </>
      )}
    </div>
  );
}

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#FFFFFF",
  borderRadius: "8px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  border: "1px solid #E5E7EB",
  fontSize: "13px",
};

function IconBadge({
  color,
  size = 40,
  children,
}: {
  color: "primary" | "success";
  size?: number;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: `${color}.main`,
        bgcolor: (t) => alpha(t.palette[color].main, 0.1),
      }}
    >
      {children}
    </Box>
  );
}

function DashboardCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Paper variant="outlined" className="flex flex-col p-6">
      <Box
        className="mb-4 flex items-center gap-2 pb-3"
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        {icon}
        <Typography variant="h5" component="h3">
          {title}
        </Typography>
      </Box>
      {children}
    </Paper>
  );
}

function KpiCard({
  label,
  value,
  icon,
  color,
  footer,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  color: "primary" | "success";
  footer?: ReactNode;
}) {
  return (
    <Paper variant="outlined" className="flex items-center justify-between p-6">
      <div className="flex flex-col items-start gap-1">
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography variant="h1" component="p" sx={{ fontWeight: 800 }}>
          {value}
        </Typography>
        {footer}
      </div>
      <IconBadge color={color} size={56}>
        {icon}
      </IconBadge>
    </Paper>
  );
}

function RankingList({ items }: { items: { nombre: string; total: number }[] }) {
  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
        Sin datos registrados
      </Typography>
    );
  }
  const maxTotal = items[0]?.total || 1;
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <Box
          key={item.nombre}
          className="relative overflow-hidden rounded-lg p-3"
          sx={{ border: 1, borderColor: "divider", bgcolor: "background.default" }}
        >
          {/* Barra de progreso de fondo */}
          <Box
            className="absolute inset-y-0 left-0"
            sx={{
              width: `${Math.round((item.total / maxTotal) * 100)}%`,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
              transition: "width .5s",
            }}
          />
          <div className="relative flex items-center justify-between gap-4">
            <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
              <Box component="span" sx={{ mr: 1, fontWeight: 700, color: "primary.main" }}>
                #{index + 1}
              </Box>
              {item.nombre}
            </Typography>
            <div className="shrink-0 text-right">
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {item.total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                órdenes
              </Typography>
            </div>
          </div>
        </Box>
      ))}
    </div>
  );
}
