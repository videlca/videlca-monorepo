import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { PatronDiasSemanaDto } from "../../../api/dtos";
import type { Servicio } from "../../../api/types/servicio";
import type { MesesLiquidadosOrden } from "../../../api/types/orden-servicio";
import { SelectorDiasSemana } from "./ConfigurarHorariosServicios";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// "2026-11-01" -> "Noviembre 2026"
const nombreMes = (fecha: string) =>
  `${MESES[Number(fecha.slice(5, 7)) - 1]} ${fecha.slice(0, 4)}`;

// "2026-10-31" -> "31/10/2026"
const fechaCorta = (fecha: string) => fecha.split("-").reverse().join("/");

// Estados en que la orden ya no se puede editar (ver validarEdicionOrden en el backend)
export const ESTADOS_ORDEN_NO_EDITABLES = ["terminado", "cancelada", "anulada"];

// Estados en que la orden ya inicio: la fecha de inicio ya no se puede cambiar
export const ESTADOS_ORDEN_INICIADA = ["iniciado", "por terminar"];

// AVISO AL EDITAR UNA ORDEN: estado que no permite editar y/o meses ya liquidados. La edicion solo aplica a los meses
// que aun no se han liquidado; lo ya liquidado (valor, fechas, horario y dias) queda tal cual
export const AvisoEdicionOrden = ({
  estado,
  fechaFinActual,
  mesesLiquidados,
}: {
  estado: string;
  fechaFinActual: string | null;
  mesesLiquidados: MesesLiquidadosOrden | undefined;
}) => {
  const estadoNormalizado = estado.toLowerCase();

  if (ESTADOS_ORDEN_NO_EDITABLES.includes(estadoNormalizado)) {
    return (
      <Alert severity="error">
        <AlertTitle>Esta orden no se puede modificar</AlertTitle>
        La orden se encuentra en estado "{estado}". Si el servicio continúa,
        cree una nueva orden de servicio.
      </Alert>
    );
  }

  const meses = mesesLiquidados?.meses ?? [];

  if (meses.length === 0 || !mesesLiquidados?.ultimoDiaLiquidado) return null;

  const listaMeses = meses
    .map(
      (m) =>
        `${m.mes} (grupo ${m.idGrupoLiquidacion}, ${m.grupoAprobado ? "aprobado" : "pendiente de aprobación"})`,
    )
    .join(", ");

  // fechaFinActual puede venir como "YYYY-MM-DD" o ISO completo
  const finActual = fechaFinActual ? fechaFinActual.slice(0, 10) : null;
  const todoLiquidado =
    finActual != null && finActual <= mesesLiquidados.ultimoDiaLiquidado;

  if (todoLiquidado) {
    return (
      <Alert severity="error">
        <AlertTitle>Todos los meses de esta orden ya fueron liquidados</AlertTitle>
        Meses liquidados: {listaMeses}. No queda ningún mes por liquidar, así
        que la orden no se puede modificar. Si necesita corregir un mes ya
        liquidado, elimine su grupo desde el historial de liquidaciones, edite
        la orden y vuelva a liquidar.
      </Alert>
    );
  }

  return (
    <Alert severity="warning">
      <AlertTitle>Esta orden ya tiene liquidaciones</AlertTitle>
      Meses liquidados: {listaMeses}. Lo liquidado no cambia: las
      modificaciones aplican desde{" "}
      <b>{nombreMes(mesesLiquidados.fechaFinMinima!)}</b> en adelante. La fecha
      de inicio ya no se puede cambiar y la fecha de fin debe ser posterior al{" "}
      {fechaCorta(mesesLiquidados.ultimoDiaLiquidado)}. Si necesita corregir un
      mes ya liquidado, elimine su grupo desde el historial de liquidaciones,
      edite la orden y vuelva a liquidar.
    </Alert>
  );
};

// DIAS DE LA SEMANA DE CADA SERVICIO DE UNA ORDEN DE CATALOGO, EN LA EDICION. Cada fila de "configuracion" es un
// servicio de la orden (una unidad); selectedServices trae el servicio de cada fila en la misma posicion
export const EditarDiasServiciosOrden = <T extends PatronDiasSemanaDto>({
  selectedServices,
  configuracion,
  setConfiguracion,
  disabled = false,
}: {
  selectedServices: Servicio[];
  configuracion: T[];
  setConfiguracion: (updater: (prev: T[]) => T[]) => void;
  disabled?: boolean;
}) => {
  if (configuracion.length === 0) return null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
      <div>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Días en que se presta cada servicio
        </Typography>
        <Typography variant="caption" color="text.secondary">
          El cambio aplica a los meses que aún no se han liquidado.
        </Typography>
      </div>
      {configuracion.map((_, index) => (
        <Paper
          key={index}
          variant="outlined"
          className="flex flex-col gap-2 p-4"
          sx={disabled ? { opacity: 0.6, pointerEvents: "none" } : undefined}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {selectedServices[index]?.descripcion ?? `Servicio ${index + 1}`}
          </Typography>
          <SelectorDiasSemana
            indices={[index]}
            configuracionServicioTarifa={configuracion}
            setConfiguracionServicioTarifa={setConfiguracion}
          />
        </Paper>
      ))}
    </div>
  );
};
