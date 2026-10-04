import { CalendarIcon, ClockIcon, MapPinIcon } from "lucide-react";
import { SimpleModal } from "../../common/SimpleModal";
import { getStatusColor } from "../../../utils/StatusColor";
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
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
            <div className="min-w-0">
              {orden.idLocacion && (
                <p className="flex items-center gap-1 truncate text-gray-600">
                  <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0" />
                  {orden.idLocacion.nombre} - {orden.idLocacion.direccion}
                </p>
              )}
              <p className="mt-0.5 flex items-center gap-1 text-gray-500">
                <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                {orden.fechaInicio || ""} → {orden.fechaFin || "Indefinida"}
              </p>
            </div>
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap capitalize ${getStatusColor(orden.idEstadoOrdenServicio?.nombre || "")}`}
            >
              {orden.idEstadoOrdenServicio?.nombre}
            </span>
          </div>

          {servicios.length === 0 ? (
            <p className="rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-500">
              Esta orden no tiene servicios registrados.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 rounded-lg border border-gray-300">
              {servicios.map((grupo) => (
                <li
                  key={grupo.key}
                  className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">
                      {grupo.servicio
                        ? `${grupo.servicio.codigo} — ${grupo.servicio.descripcion}`
                        : "Servicio sin tarifa activa"}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-600">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3.5 w-3.5" />
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
                    </p>
                  </div>
                  <span className="rounded-full border border-gray-300 bg-gray-100 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-gray-600">
                    {grupo.fechas.length > 0
                      ? `${grupo.cantidad} ${grupo.cantidad === 1 ? "día" : "días"}`
                      : `${grupo.cantidad} ${grupo.cantidad === 1 ? "unidad" : "unidades"}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </SimpleModal>
  );
};
