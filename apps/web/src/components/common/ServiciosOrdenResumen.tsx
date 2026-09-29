import type {
  OrdenServicio,
  OrdenServicioDetalle,
} from "../../api/types/orden-servicio";

// "08:00:00" -> "08:00"
const formatHora = (hora: string | null | undefined) =>
  hora ? hora.slice(0, 5) : "--:--";

// Una fila por servicio + horario distinto. Las filas repetidas se colapsan en una sola: en Monitoreo de alarmas
// cada unidad es una fila de detalles (pueden ser 100+ del mismo servicio) y en "a_medida" cada dia del rango es
// una fila con la misma tarifa de turno
const serviciosUnicos = (detalles: OrdenServicioDetalle[]) => {
  const unicos = new Map<string, OrdenServicioDetalle>();
  detalles.forEach((detalle) => {
    const key = [
      detalle.idTarifa?.idServicio?.idServicio ??
        `tarifa-${detalle.idTarifa?.idTarifa ?? "na"}`,
      detalle.horaInicio,
      detalle.horaFin,
    ].join("|");
    if (!unicos.has(key)) unicos.set(key, detalle);
  });
  return Array.from(unicos.entries());
};

export const ServiciosOrdenResumen = ({ orden }: { orden: OrdenServicio }) => {
  const servicios = serviciosUnicos(orden.detalles ?? []);

  if (servicios.length === 0) {
    return (
      <p className="pl-4 text-left text-sm text-gray-500">
        Esta orden no tiene servicios registrados.
      </p>
    );
  }

  return (
    <ul className="ml-4 space-y-1 border-l-2 border-gray-300 pl-4 text-left text-sm">
      {servicios.map(([key, detalle]) => (
        <li key={key} className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-medium text-gray-800">
            {detalle.idTarifa?.idServicio?.descripcion ??
              "Servicio sin tarifa"}
          </span>
          <span className="text-gray-500">
            {formatHora(detalle.horaInicio)} - {formatHora(detalle.horaFin)}
          </span>
        </li>
      ))}
    </ul>
  );
};
