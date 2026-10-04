import { DiferenciaChip } from "../../../components/ui/common/DiferenciaChip";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "../../../components/ui/common/EmptyState";
import { SectionCard } from "../../../components/ui/common/SectionCard";
import { getYear, subMonths, subYears } from "date-fns";
import { useState } from "react";
import BarChartIcon from "@mui/icons-material/BarChart";
import SearchIcon from "@mui/icons-material/Search";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Section } from "../../../components/ui/dashboard/Section";
import { InputSelect } from "../../../components/common/InputSelect";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { FiltroTiposServicio } from "../../../components/common/FiltroTiposServicio";
import { useClientes } from "../../../api/queryFunctions/clientes";
import { useCompararLiquidacionesCliente } from "../../../api/queryFunctions/liquidaciones";
import type { CompararLiquidacionesClienteDto } from "../../../api/dtos/liquidaciones";
import type {
  DiferenciaComparacion,
  PeriodoComparacion,
  TipoServicioFiltro,
} from "../../../api/types/liquidaciones";
import { priceFormat } from "../../../utils/PriceFormat";
import {
  serializarTiposServicio,
  TIPOS_SERVICIO_FILTRO,
} from "../../../utils/tiposServicio";

export const Route = createFileRoute(
  "/dashboard/liquidaciones/comparar-cliente",
)({
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

const hoy = new Date();
const mesAnterior = subMonths(hoy, 1);

const nombreMes = (mes: number) =>
  monthsOptions.find((m) => m.id === mes)?.descripcion ?? String(mes);

const metricas: {
  clave: keyof DiferenciaComparacion;
  label: string;
  esMoneda: boolean;
}[] = [
  { clave: "cantidadGrupos", label: "Grupos (facturas)", esMoneda: false },
  { clave: "cantidadOrdenes", label: "Órdenes", esMoneda: false },
  {
    clave: "cantidadLiquidacionesOrdenes",
    label: "Liquidaciones de órdenes",
    esMoneda: false,
  },
  { clave: "cantidadAdicionales", label: "Adicionales", esMoneda: false },
  { clave: "totalAntesIva", label: "Total antes de IVA", esMoneda: true },
  { clave: "totalIva", label: "IVA", esMoneda: true },
  { clave: "totalConIva", label: "Total con IVA", esMoneda: true },
];

const PorcentajeTexto = ({ porcentaje }: { porcentaje: number | null }) => {
  if (porcentaje === null) {
    return (
      <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 500 }}>
        N/A
      </Typography>
    );
  }
  const color =
    porcentaje > 0 ? "success.main" : porcentaje < 0 ? "error.main" : "text.secondary";
  return (
    <Typography variant="body2" sx={{ fontWeight: 600, color }}>
      {porcentaje > 0 ? "+" : ""}
      {porcentaje}%
    </Typography>
  );
};

const PeriodoCard = ({
  titulo,
  periodo,
  acento,
}: {
  titulo: string;
  periodo: PeriodoComparacion;
  acento: "primary" | "info";
}) => (
  <Paper variant="outlined" className="flex flex-col overflow-hidden">
    <Box
      className="p-4"
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: (t) => alpha(t.palette[acento].main, 0.08),
        color: `${acento}.main`,
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {titulo}
      </Typography>
      <Typography variant="h4" component="p" color="text.primary">
        {nombreMes(periodo.mes)} {periodo.anio}
      </Typography>
    </Box>

    <div className="grid grid-cols-2 gap-3 p-4">
      <Dato label="Grupos (facturas)" valor={periodo.cantidadGrupos} />
      <Dato label="Órdenes" valor={periodo.cantidadOrdenes} />
      <Dato
        label="Liquidaciones de órdenes"
        valor={periodo.cantidadLiquidacionesOrdenes}
      />
      <Dato label="Adicionales" valor={periodo.cantidadAdicionales} />
    </div>

    <Box className="flex flex-col gap-1 px-4 py-3" sx={{ borderTop: 1, borderColor: "divider" }}>
      <Fila label="Total antes de IVA" valor={priceFormat(periodo.totalAntesIva)} />
      <Fila label="IVA" valor={priceFormat(periodo.totalIva)} />
      <Fila label="Total con IVA" valor={priceFormat(periodo.totalConIva)} destacado />
    </Box>

    <Box className="p-4" sx={{ borderTop: 1, borderColor: "divider" }}>
      <Typography
        variant="caption"
        color="text.secondary"
        component="p"
        sx={{ mb: 1, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}
      >
        Grupos de liquidación
      </Typography>
      {periodo.grupos.length === 0 ? (
        <Box
          sx={{
            py: 2,
            textAlign: "center",
            border: 1,
            borderStyle: "dashed",
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" color="text.disabled">
            Sin grupos aprobados en este mes.
          </Typography>
        </Box>
      ) : (
        <ul className="flex flex-col gap-2">
          {periodo.grupos.map((grupo) => (
            <Paper component="li" variant="outlined" key={grupo.idGrupoLiquidacion} className="p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {grupo.descripcion}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(grupo.fechaCreacion).toLocaleDateString("es-ES")}
                </Typography>
              </div>
              <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>
                {grupo.cantidadOrdenes} órdenes · {grupo.cantidadAdicionales} adicionales
              </Typography>
              <div className="mt-2 flex flex-wrap justify-between gap-2">
                <Typography variant="caption" color="text.secondary">
                  Antes de IVA: {priceFormat(grupo.totalAntesIva)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  IVA: {priceFormat(grupo.totalIva)}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "success.main" }}>
                  Total: {priceFormat(grupo.totalConIva)}
                </Typography>
              </div>
            </Paper>
          ))}
        </ul>
      )}
    </Box>
  </Paper>
);

const Fila = ({
  label,
  valor,
  destacado = false,
}: {
  label: string;
  valor: string;
  destacado?: boolean;
}) => (
  <div className="flex justify-between">
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={destacado ? { fontSize: "1rem", fontWeight: 600, color: "success.main" } : { fontWeight: 500 }}
    >
      {valor}
    </Typography>
  </div>
);

const Dato = ({ label, valor }: { label: string; valor: number }) => (
  <div>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h3" component="p">
      {valor}
    </Typography>
  </div>
);

function RouteComponent() {
  const [cliente, setCliente] = useState<string>("");
  const [anioA, setAnioA] = useState<string>(
    getYear(mesAnterior).toString(),
  );
  const [mesA, setMesA] = useState<string>(
    (mesAnterior.getMonth() + 1).toString(),
  );
  const [anioB, setAnioB] = useState<string>(getYear(hoy).toString());
  const [mesB, setMesB] = useState<string>((hoy.getMonth() + 1).toString());
  const [tipos, setTipos] =
    useState<TipoServicioFiltro[]>(TIPOS_SERVICIO_FILTRO);
  const [consulta, setConsulta] =
    useState<CompararLiquidacionesClienteDto | null>(null);

  const { data: clientes } = useClientes();
  const clientesOptions =
    clientes?.data?.data?.map((c) => ({
      id: c.idCliente,
      descripcion: c.nombre,
    })) ?? [];

  const parametros: CompararLiquidacionesClienteDto = consulta ?? {
    idCliente: 0,
    anioA: 0,
    mesA: 0,
    anioB: 0,
    mesB: 0,
    tiposServicio: "",
  };
  const {
    data: comparacionData,
    isFetching,
    isError,
    error,
  } = useCompararLiquidacionesCliente(parametros, consulta !== null);

  const comparacion = comparacionData?.data;
  const tiposSerializados = serializarTiposServicio(tipos);
  const puedeBuscar = Number(cliente) > 0 && tiposSerializados !== "";
  const aDespuesDeB =
    Number(anioA) * 100 + Number(mesA) > Number(anioB) * 100 + Number(mesB);

  const buscar = () => {
    if (!puedeBuscar) return;
    setConsulta({
      idCliente: Number(cliente),
      anioA: Number(anioA),
      mesA: Number(mesA),
      anioB: Number(anioB),
      mesB: Number(mesB),
      tiposServicio: tiposSerializados,
    });
  };

  const periodoSelector = (
    titulo: string,
    color: "primary" | "info",
    anio: string,
    setAnio: (v: string) => void,
    mes: string,
    setMes: (v: string) => void,
    sufijo: "A" | "B",
  ) => (
    <Paper variant="outlined" className="p-4" sx={{ borderColor: `${color}.light` }}>
      <Typography variant="h6" component="p" sx={{ mb: 1.5, color: `${color}.main` }}>
        {titulo}
      </Typography>
      <div className="flex flex-wrap gap-4">
        <div className="min-w-40 flex-1">
          <InputSelect
            label="Año"
            placeholder="Selecciona un año"
            id={`anio${sufijo}`}
            value={anio}
            onChange={(e) => setAnio(e.target.value)}
            options={yearsOptions}
          />
        </div>
        <div className="min-w-40 flex-1">
          <InputSelect
            label="Mes"
            placeholder="Selecciona un mes"
            id={`mes${sufijo}`}
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            options={monthsOptions}
          />
        </div>
      </div>
    </Paper>
  );

  return (
    <Section>
      <div className="flex flex-col gap-6">
        <Typography variant="body2" color="text.secondary">
          Compara lo liquidado a un cliente entre dos meses. Solo se tienen en cuenta los grupos aprobados.
        </Typography>

        <SectionCard>
          <div className="max-w-xl">
            <InputSelect
              label="Cliente"
              placeholder="Selecciona un cliente"
              id="compararCliente"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              options={clientesOptions}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {periodoSelector("Mes A (base)", "primary", anioA, setAnioA, mesA, setMesA, "A")}
            {periodoSelector("Mes B (comparar)", "info", anioB, setAnioB, mesB, setMesB, "B")}
          </div>

          {aDespuesDeB && (
            <Alert severity="warning" icon={<WarningAmberIcon fontSize="small" />}>
              El mes A es posterior al mes B. La diferencia siempre se calcula
              como B − A.
            </Alert>
          )}

          <div className="flex flex-wrap items-end justify-between gap-4">
            <FiltroTiposServicio value={tipos} onChange={setTipos} />
            <ButtonAction
              type="button"
              onClick={buscar}
              disabled={!puedeBuscar || isFetching}
              Icon={SearchIcon}
              label={isFetching ? "Buscando..." : "Buscar"}
            />
          </div>
        </SectionCard>

        {isFetching && (
          <div className="flex items-center justify-center gap-2 py-12">
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Cargando comparación...
            </Typography>
          </div>
        )}

        {!isFetching && isError && (
          <Alert severity="error">
            {error.message || "Error al comparar las liquidaciones del cliente"}
          </Alert>
        )}

        {!isFetching && !isError && comparacion && (
          <>
            <Paper variant="outlined" className="p-4">
              <Typography variant="h4" component="p">
                {comparacion.cliente.nombre}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                NIT: {comparacion.cliente.numeroIdentificacion}
              </Typography>
            </Paper>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <PeriodoCard
                titulo="Mes A"
                periodo={comparacion.periodoA}
                acento="primary"
              />
              <PeriodoCard
                titulo="Mes B"
                periodo={comparacion.periodoB}
                acento="info"
              />
            </div>

            <Paper variant="outlined" sx={{ overflow: "hidden" }}>
              <Typography
                variant="h4"
                component="h2"
                className="p-4"
                sx={{ borderBottom: 1, borderColor: "divider" }}
              >
                Diferencia (B − A)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Métrica</TableCell>
                      <TableCell>Valor</TableCell>
                      <TableCell>Porcentaje</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metricas.map(({ clave, label, esMoneda }) => (
                      <TableRow key={clave}>
                        <TableCell sx={{ fontWeight: 500 }}>{label}</TableCell>
                        <TableCell>
                          <DiferenciaChip
                            value={comparacion.diferencia[clave].valor}
                            format={esMoneda ? priceFormat : String}
                          />
                        </TableCell>
                        <TableCell>
                          <PorcentajeTexto
                            porcentaje={comparacion.diferencia[clave].porcentaje}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}

        {!consulta && (
          <EmptyState
            icon={<BarChartIcon />}
            title="Selecciona un cliente y dos meses para ver la comparación."
          />
        )}
      </div>
    </Section>
  );
}
