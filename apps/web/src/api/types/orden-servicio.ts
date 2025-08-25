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
  fechaInicioOrden: string;
  fechaFinOrden: string;
  precioTotal: number;
  fechaCreacion: string;
  fechaActualizacion: string;
  observacionesOrdenServicio: ObservacionOrdenServicio[];
  tarifas: TarifaOrdenServicio[];
  // TODO: Verificar tipo
  liquidaciones: any[];
}

export interface TarifaOrdenServicio {
  idTarifa: Tarifa;
  cantidadPersonal: number;
  horaInicio: string;
  horaFin: string;
  idOrdenServicioTarifa: number;
  precio: number | null;
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