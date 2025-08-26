import type { OrdenServicioTarifa } from "./orden-servicio";
import type { Personal } from "./personal";

export interface ProgramacionPersonal {
  horaFin: string;
  horaInicio: string;
  idProgramacionPersonal: number;
  idPersonal: Personal;
  idOrdenServicioTarifa: OrdenServicioTarifa;
}