import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import Table from "../../../components/common/Table";
import {
  useComparativaPeriodos,
  usePeriodos,
} from "../../../api/queryFunctions/tarifas/periodo";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useState, type ReactNode } from "react";
import { DiferenciaChip } from "../../../components/ui/common/DiferenciaChip";
import { EmptyState } from "../../../components/ui/common/EmptyState";
import { SectionCard } from "../../../components/ui/common/SectionCard";
import BarChartIcon from "@mui/icons-material/BarChart";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
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

// ─── Columns ───────────────────────────────────────────────

const columnsNuevos: ColumnDef<ComparativaServicio>[] = [
  {
    header: "Servicio",
    accessorKey: "nombreServicio",
    cell: ({ row }) => (
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {row.original.nombreServicio}
      </Typography>
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
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {row.original.nombreServicio}
      </Typography>
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
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {row.original.nombreServicio}
      </Typography>
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
    cell: ({ row }) => <DiferenciaChip value={row.original.diferencia} format={formatCurrency} />,
  },
];

const columnsOrdenes: ColumnDef<ComparativaOrdenes>[] = [
  {
    header: "Servicio",
    accessorKey: "nombreServicio",
    cell: ({ row }) => (
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {row.original.nombreServicio}
      </Typography>
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
    cell: ({ row }) => <DiferenciaChip value={row.original.diferencia} />,
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

  const periodoSelect = (
    id: string,
    label: string,
    placeholder: string,
    value: number | null,
    setValue: (v: number | null) => void,
  ) => (
    <TextField
      select
      id={id}
      label={label}
      value={value ?? 0}
      onChange={(e) => {
        const val = Number(e.target.value);
        setValue(val === 0 ? null : val);
      }}
      slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
    >
      <MenuItem value={0} disabled sx={{ display: "none" }}>
        {placeholder}
      </MenuItem>
      {periodos.map((p) => (
        <MenuItem key={p.idPeriodo} value={p.idPeriodo}>
          {p.nombre}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <Section>
      <div className="flex flex-col gap-6">
        <Typography variant="body2" color="text.secondary">
          Selecciona dos periodos de facturación para comparar servicios, precios y órdenes.
        </Typography>

        {/* ─── Selectors ─── */}
        <SectionCard>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {periodoSelect(
              "periodoA",
              "Periodo A (base)",
              "Seleccionar periodo base...",
              selectedPeriodoA,
              setSelectedPeriodoA,
            )}
            {periodoSelect(
              "periodoB",
              "Periodo B (comparar)",
              "Seleccionar periodo a comparar...",
              selectedPeriodoB,
              setSelectedPeriodoB,
            )}
          </div>

          {isSamePeriodo && (
            <Alert severity="error">
              Los periodos seleccionados no pueden ser el mismo.
            </Alert>
          )}
        </SectionCard>

        {/* ─── Loading ─── */}
        {canCompare && (isLoading || isFetching) && (
          <div className="flex items-center justify-center gap-2 py-12">
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Cargando comparativa...
            </Typography>
          </div>
        )}

        {/* ─── Results ─── */}
        {comparativa && !isLoading && (
          <>
            {/* ─── Period Info ─── */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <PeriodoInfo titulo="Periodo A" color="primary" periodo={comparativa.periodoA} />
              <PeriodoInfo titulo="Periodo B" color="info" periodo={comparativa.periodoB} />
            </div>

            {/* ─── Summary Cards ─── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ResumenCard
                icon={<BarChartIcon fontSize="small" color="primary" />}
                label="Servicios A"
                value={comparativa.resumen.cantidadServicios.periodoA}
              />
              <ResumenCard
                icon={<BarChartIcon fontSize="small" color="info" />}
                label="Servicios B"
                value={comparativa.resumen.cantidadServicios.periodoB}
                diff={<DiferenciaChip value={comparativa.resumen.cantidadServicios.diferencia} />}
              />
              <ResumenCard
                icon={<TrendingUpIcon fontSize="small" color="primary" />}
                label="Valor Total A"
                value={formatCurrency(comparativa.resumen.valorTotalTarifas.periodoA)}
              />
              <ResumenCard
                icon={<TrendingDownIcon fontSize="small" color="info" />}
                label="Valor Total B"
                value={formatCurrency(comparativa.resumen.valorTotalTarifas.periodoB)}
                diff={
                  <DiferenciaChip
                    value={comparativa.resumen.valorTotalTarifas.diferencia}
                    format={formatCurrency}
                  />
                }
              />
            </div>

            <BloqueComparativa
              titulo="Servicios nuevos"
              color="success"
              cantidad={comparativa.comparativa.serviciosNuevos.length}
              vacio="No hay servicios nuevos en el Periodo B."
            >
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
            </BloqueComparativa>

            <BloqueComparativa
              titulo="Servicios eliminados"
              color="error"
              cantidad={comparativa.comparativa.serviciosEliminados.length}
              vacio="No hay servicios eliminados del Periodo A."
            >
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
            </BloqueComparativa>

            <BloqueComparativa
              titulo="Cambios de precio"
              color="warning"
              cantidad={comparativa.comparativa.serviciosConCambioPrecio.length}
              vacio="No hay cambios de precio entre los periodos."
            >
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
            </BloqueComparativa>

            <BloqueComparativa
              titulo="Órdenes por servicio"
              color="primary"
              cantidad={comparativa.comparativa.ordenesPorServicio.length}
              vacio="No hay órdenes registradas en ninguno de los periodos."
            >
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
            </BloqueComparativa>
          </>
        )}

        {/* ─── Empty State ─── */}
        {!canCompare && !isSamePeriodo && (
          <EmptyState
            icon={<BarChartIcon />}
            title="Selecciona dos periodos diferentes para ver la comparativa."
          />
        )}
      </div>
    </Section>
  );
}

const PeriodoInfo = ({
  titulo,
  color,
  periodo,
}: {
  titulo: string;
  color: "primary" | "info";
  periodo: { nombre: string; fechaInicio: string; fechaFin: string };
}) => (
  <Paper
    variant="outlined"
    className="p-4"
    sx={{
      borderColor: `${color}.light`,
      bgcolor: (t) => alpha(t.palette[color].main, 0.06),
    }}
  >
    <Typography
      variant="caption"
      sx={{ fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: `${color}.main` }}
    >
      {titulo}
    </Typography>
    <Typography variant="h4" component="p">
      {periodo.nombre}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {periodo.fechaInicio} → {periodo.fechaFin}
    </Typography>
  </Paper>
);

const ResumenCard = ({
  icon,
  label,
  value,
  diff,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  diff?: ReactNode;
}) => (
  <Paper variant="outlined" className="flex flex-col items-start gap-1 p-5">
    <div className="flex items-center gap-2">
      {icon}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}
      >
        {label}
      </Typography>
    </div>
    <Typography variant="h2" component="p">
      {value}
    </Typography>
    {diff}
  </Paper>
);

const BloqueComparativa = ({
  titulo,
  color,
  cantidad,
  vacio,
  children,
}: {
  titulo: string;
  color: "success" | "error" | "warning" | "primary";
  cantidad: number;
  vacio: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center gap-2">
      <Typography variant="h4" component="h2">
        {titulo}
      </Typography>
      <Chip size="small" color={color} variant="outlined" label={cantidad} />
    </div>
    {cantidad > 0 ? (
      children
    ) : (
      <Box
        sx={{
          py: 3,
          textAlign: "center",
          border: 1,
          borderStyle: "dashed",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Typography variant="body2" color="text.disabled">
          {vacio}
        </Typography>
      </Box>
    )}
  </div>
);
