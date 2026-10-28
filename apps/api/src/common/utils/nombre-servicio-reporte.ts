// src/common/utils/nombre-servicio-reporte.ts
import { Servicio } from '../../servicios/entities';
import { TipoServicioInterface } from '../../servicios/interfaces/tipo-servicio.interface';

// NOMBRE CON EL QUE SALEN TODOS LOS SERVICIOS DE MONITOREO DE ALARMAS EN LOS ARCHIVOS GENERADOS (PDFs, consolidacion,
// interfase, anexo), sin importar la descripcion que tengan en la tabla servicio (ej. "Tarifa Olimpica")
export const NOMBRE_SERVICIO_MONITOREO_REPORTES = 'Servicio monitoreo de alarmas';

// Requiere que el servicio venga con idTipoServicio cargado
export function nombreServicioReporte(servicio: Servicio): string {
  return servicio.idTipoServicio?.nombre === TipoServicioInterface.MONITOREO_ALARMAS
    ? NOMBRE_SERVICIO_MONITOREO_REPORTES
    : servicio.descripcion;
}
