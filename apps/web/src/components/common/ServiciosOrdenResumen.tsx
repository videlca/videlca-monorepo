import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
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
      <Typography variant="body2" color="text.secondary" sx={{ pl: 2, textAlign: "left" }}>
        Esta orden no tiene servicios registrados.
      </Typography>
    );
  }

  return (
    <Box
      component="ul"
      className="ml-4 flex flex-col gap-1 pl-4 text-left"
      sx={{ borderLeft: 2, borderColor: "divider" }}
    >
      {servicios.map(([key, detalle]) => (
        <li key={key} className="flex flex-wrap items-baseline gap-x-2">
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {detalle.idTarifa?.idServicio?.descripcion ??
              "Servicio sin tarifa"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatHora(detalle.horaInicio)} - {formatHora(detalle.horaFin)}
          </Typography>
        </li>
      ))}
    </Box>
  );
};
