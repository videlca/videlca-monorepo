import type { EstadoOrden, Puesto, Usuario } from "../../types";
import type { Tarifa } from "./periodo";
import type { PersonalAsignado } from "./programacion-personal";

export interface OrdenServicio {
  idOrdenServicio: number;
  ordenServicioId: OrdenServicioId;
  idUsuarioCreacion: Usuario;
  idEstadoOrdenServicio: EstadoOrden;
  idLocacion: Puesto;
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
  programaciones: PersonalAsignado[];
}

// observaciones orden servicio
export interface ObservacionOrdenServicio {
  idObservacionOrdenServicio: number;
  descripcion: string;
  idUsuario: Usuario;
  idOrdenServicio: OrdenServicio;
}