import type { EstadoOrden, Puesto, Usuario } from "../../types";
import type { GruposLiquidaciones } from "./liquidaciones";
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

export interface OrdenServicioIdAnulados {
  id: number;
  descripcionId: string;
  motivo: string;
  fechaCreacion: string;
  consecutivo: number;
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
  fechaCreacion: string;
}

// observaciones grupo orden servicio
export interface ObservacionGrupoOrdenServicio {
  idObservacionGrupoOrdenServicio: number;
  descripcion: string;
  idUsuario: Usuario;
  idGrupoLiquidacion: GruposLiquidaciones;
  fechaCreacion: string;
}

// Respuesta de POST /orden-servicio/obtener-precio (calcula el precio de todos los servicios de la orden a la vez)
// Solo viene lleno cuando el servicio es de horario Mixto + Por hora (su precio depende del valor hora del periodo activo,
// se desconoce cuantas horas seran de dia/noche y ordinarias/dominicales hasta que se arma la orden)
export interface CostoHoraOrdenServicio {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tipoHorario: string;
  dominical: boolean;
  horas: number;
  costosDirectos: number;
  seguroVida: number;
  aui: number;
}

export interface PrecioServicioOrdenResponse {
  idServicio: number;
  idTarifa: number | null;
  message: string;
  precio: number | null;
  costosDirectos: number | null;
  seguroVida: number | null;
  costosDirectosSeguroVida: number | null;
  aui: number | null;
  precioAntesIva: number | null;
  iva: number | null;
  costos_horas: CostoHoraOrdenServicio[];
}

export interface PrecioOrdenResponse {
  message: string;
  precio: number | null;
  costosDirectos: number | null;
  seguroVida: number | null;
  costosDirectosSeguroVida: number | null;
  aui: number | null;
  precioAntesIva: number | null;
  iva: number | null;
  servicios: PrecioServicioOrdenResponse[];
}
