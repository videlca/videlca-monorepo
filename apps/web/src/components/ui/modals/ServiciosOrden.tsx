import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { OrderStateLabel } from "../../common/OrderStateLabel";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import { SimpleModal } from "../../common/SimpleModal";
import type {
  OrdenServicio,
  OrdenServicioDetalle,
} from "../../../api/types/orden-servicio";
import type { Servicio } from "../../../api/types/servicio";

type DiaSemanaKey =
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado"
  | "domingo";

const DIAS_SEMANA_LABELS: Record<DiaSemanaKey, string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  domingo: "Dom",
};

const DIAS_SEMANA_KEYS = Object.keys(DIAS_SEMANA_LABELS) as DiaSemanaKey[];

const formatDias = (detalle: OrdenServicioDetalle) => {
  const activos = DIAS_SEMANA_KEYS.filter((dia) => detalle[dia]);
  const dias =
    activos.length === DIAS_SEMANA_KEYS.length
      ? "Todos los días"
      : activos.map((dia) => DIAS_SEMANA_LABELS[dia]).join(", ");
  return detalle.incluyeFestivos ? `${dias} · incluye festivos` : dias;
};

// "08:00:00" -> "08:00"
const formatHora = (hora: string | null | undefined) =>
  hora ? hora.slice(0, 5) : "--:--";

interface ServicioAgrupado {
  key: string;
  servicio: Servicio | undefined;
  horaInicio: string;
  horaFin: string;
  // Solo en "catalogo" (fecha null): dias de la semana en que se presta el servicio
  dias: string | null;
  cantidad: number;
  // Solo en "a_medida": cada fila de detalles es un dia especifico del rango
  fechas: string[];
  totalHoras: number | null;
}

// En "catalogo" cada fila de detalles es una unidad de un servicio; en "a_medida" cada fila es un dia del rango
// (misma tarifa de turno repetida). Se agrupan las filas equivalentes (mismo servicio + horario + dias) para
// mostrar un resumen por servicio en vez de una fila por unidad/dia
const agruparServicios = (detalles: OrdenServicioDetalle[]) => {
  const grupos = new Map<string, ServicioAgrupado>();

  detalles.forEach((detalle) => {
    const servicio = detalle.idTarifa?.idServicio;
    const esPorFecha = detalle.fecha != null;
    const dias = esPorFecha ? null : formatDias(detalle);
    const key = [
      servicio?.idServicio ?? `tarifa-${detalle.idTarifa?.idTarifa ?? "na"}`,
      detalle.horaInicio,
      detalle.horaFin,
      dias ?? "fecha",
    ].join("|");

    if (!grupos.has(key)) {
      grupos.set(key, {
        key,
        servicio,
        horaInicio: detalle.horaInicio,
        horaFin: detalle.horaFin,
        dias,
        cantidad: 0,
        fechas: [],
        totalHoras: null,
      });
    }

    const grupo = grupos.get(key)!;
    grupo.cantidad += 1;
    if (detalle.fecha) grupo.fechas.push(detalle.fecha.slice(0, 10));
    if (detalle.cantidadHoras != null) {
      grupo.totalHoras =
        (grupo.totalHoras ?? 0) + (Number(detalle.cantidadHoras) || 0);
    }
  });

  return Array.from(grupos.values()).map((grupo) => ({
    ...grupo,
    fechas: grupo.fechas.sort(),
  }));
};

interface ServiciosOrdenProps {
  onClose: () => void;
  // Null cuando el modal esta cerrado
  orden: OrdenServicio | null;
}

export const ServiciosOrden = ({ onClose, orden }: ServiciosOrdenProps) => {
  const servicios = agruparServicios(orden?.detalles ?? []);

  return (
    <SimpleModal
      isOpen={orden !== null}
      onClose={onClose}
      title={`Servicios · ${orden?.ordenServicioId?.descripcionId ?? ""}`}
      size="2xl"
      clickOutsideClose
    >
      {orden && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              {orden.idLocacion && (
                <Typography variant="body2" color="text.secondary" noWrap className="flex items-center gap-1">
                  <PlaceOutlinedIcon sx={{ fontSize: 16 }} />
                  {orden.idLocacion.nombre} - {orden.idLocacion.direccion}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" className="flex items-center gap-1" sx={{ mt: 0.5 }}>
                <CalendarMonthOutlinedIcon sx={{ fontSize: 16 }} />
                {orden.fechaInicio || ""} → {orden.fechaFin || "Indefinida"}
              </Typography>
            </div>
            <OrderStateLabel state={orden.idEstadoOrdenServicio?.nombre || ""} />
          </div>

          {servicios.length === 0 ? (
            <Paper variant="outlined" sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                Esta orden no tiene servicios registrados.
              </Typography>
            </Paper>
          ) : (
            <Paper variant="outlined">
              <List disablePadding>
                {servicios.map((grupo, i) => (
                  <ListItem
                    key={grupo.key}
                    divider={i < servicios.length - 1}
                    className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1"
                  >
                    <div className="min-w-0">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {grupo.servicio
                          ? `${grupo.servicio.codigo} — ${grupo.servicio.descripcion}`
                          : "Servicio sin tarifa activa"}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        component="div"
                        className="flex flex-wrap items-center gap-x-3 gap-y-1"
                        sx={{ mt: 0.5 }}
                      >
                        <span className="flex items-center gap-1">
                          <ScheduleOutlinedIcon sx={{ fontSize: 16 }} />
                          {formatHora(grupo.horaInicio)} -{" "}
                          {formatHora(grupo.horaFin)}
                        </span>
                        {grupo.dias && <span>{grupo.dias}</span>}
                        {grupo.fechas.length > 0 && (
                          <span>
                            {grupo.fechas[0]}
                            {grupo.fechas.length > 1 &&
                              ` → ${grupo.fechas[grupo.fechas.length - 1]}`}
                          </span>
                        )}
                        {grupo.totalHoras != null && (
                          <span>{grupo.totalHoras} h</span>
                        )}
                      </Typography>
                    </div>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={
                        grupo.fechas.length > 0
                          ? `${grupo.cantidad} ${grupo.cantidad === 1 ? "día" : "días"}`
                          : `${grupo.cantidad} ${grupo.cantidad === 1 ? "unidad" : "unidades"}`
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </div>
      )}
    </SimpleModal>
  );
};
