import type { EstadoOrden, Locacion, Usuario } from "../../types";
import type { Tarifa } from "./periodo";
import type { ProgramacionPersonal } from "./personal";

export interface OrdenServicio {
  idOrdenServicio: number;
  ordenServicioId: OrdenServicioId;
  idUsuarioCreacion: Usuario;
  idEstadoOrdenServicio: EstadoOrden;
  idLocacion: Locacion;
  fechaInicio: string;
  fechaFin: string;
  precioTotal: number;
  fechaCreacion: string;
  observacionesOrdenServicio: ObservacionOrdenServicio[];
  tarifas: Tarifa[];
}

export interface OrdenServicioId {
  idOrdenServicioId: number;
  descripcionId: string;
  fechaCreacion: string;
  anulado: boolean;
  ordenServicio: OrdenServicio;
}

export interface ObservacionOrdenServicio {
  idObservacionOrdenServicio: number;
  descripcion: string;
  idUsuario: Usuario;
  idOrdenServicio: OrdenServicio;
}

export interface OrdenServicioTarifa {
  idOrdenServicioTarifa: number;
  idOrdenServicio: OrdenServicio;
  idTarifa: Tarifa;
  cantidadPersonal: number; 
  horaInicio: string;
  horaFin: string;
  precio: number | null;
  programaciones: ProgramacionPersonal[];
}