import type { EstadoOrden, Locacion, Usuario } from "../../types";
import type { Tarifa } from "./periodo";

export interface OrdenServicio {
  idOrdenServicio: number;
  idUsuarioCreacion: Usuario;
  idEstadoOrdenServicio: EstadoOrden;
  idLocacion: Locacion;
  idTarifa: Tarifa;
  cantidadPersonal: number;
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  fechaCreacion: string;
}