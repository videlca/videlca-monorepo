import type { Cliente, EstadoOrden, Puesto, Usuario } from "../../types";
import type { GruposLiquidaciones } from "./liquidaciones";
import type { Tarifa } from "./periodo";
import type { PersonalAsignado } from "./programacion-personal";

export interface OrdenServicio {
  idOrdenServicio: number;
  ordenServicioId: OrdenServicioId;
  idUsuarioCreacion: Usuario;
  idEstadoOrdenServicio: EstadoOrden;
  // Vigilancia y escolta trae idLocacion (idCliente null), Monitoreo de alarmas trae idCliente (idLocacion null)
  idLocacion: Puesto | null;
  idCliente: Cliente | null;
  fechaInicio: string;
  fechaFin: string;
  fechaInicioOrden: string;
  fechaFinOrden: string;
  precioTotal: number;
  fechaCreacion: string;
  fechaActualizacion: string;
  observacionesOrdenServicio: ObservacionOrdenServicio[];
  detalles: OrdenServicioDetalle[];
  // TODO: Verificar tipo
  liquidaciones: any[];
}

// Fila del desglose de una orden ya creada (GET /orden-servicio/:id). idTarifa siempre viene con su idServicio
// cargado (ver findOneOrdenRelations en el backend). En modo "catalogo" cada fila es un servicio elegido del
// catalogo (cantidadHoras/fecha en null); en modo "a_medida" cada fila es un dia del rango (idTarifa apunta a
// la tarifa de turno de 24h que el backend resolvio internamente para ese dia, puede repetirse entre filas)
export interface OrdenServicioDetalle {
  idOrdenServicioDetalle: number;
  idTarifa: Tarifa;
  cantidadHoras: number | null;
  fecha: string | null;
  horaInicio: string;
  horaFin: string;
  // Dias de la semana en que se presta este servicio de catalogo (default true, ver PatronDiasSemanaDto).
  // No aplican a ordenes "a_medida" (fila = un dia especifico), pero el backend igual las devuelve en true
  lunes: boolean;
  martes: boolean;
  miercoles: boolean;
  jueves: boolean;
  viernes: boolean;
  sabado: boolean;
  domingo: boolean;
  incluyeFestivos: boolean;
  costosDirectos: number | null;
  seguroVida: number | null;
  costosDirectosSeguroVida: number | null;
  aui: number | null;
  precioAntesIva: number | null;
  iva: number | null;
  precio: number | null;
}

// Fila fija de catalogo (GET /origen-servicio), solo se ajusta desde el backend (se llena por BD).
// code trae el valor de OrigenServicioEnum (ver api/dtos/orden-servicio.ts): "catalogo" | "a_medida"
export interface OrigenServicio {
  idOrigenServicio: number;
  nombre: string;
  descripcion: string;
  code: string;
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

// idTarifa: en modo "catalogo" identifica el servicio elegido; en modo "a_medida" identifica la tarifa de
// turno (24h ordinaria/dominical) que el backend resuelve internamente para ese dia (puede repetirse entre filas)
export interface PrecioServicioOrdenResponse {
  idTarifa: number;
  horaInicio: string;
  horaFin: string;
  // Solo vienen con datos en modo "a_medida" (cada fila es un dia del rango); en modo "catalogo" son null
  cantidadHoras: number | null;
  fecha: string | null;
  message: string;
  precio: number | null;
  costosDirectos: number | null;
  seguroVida: number | null;
  costosDirectosSeguroVida: number | null;
  aui: number | null;
  precioAntesIva: number | null;
  iva: number | null;
  // El backend ya no devuelve el desglose hora a hora (servicio Mixto + Por hora dejo de existir en este refactor),
  // se deja opcional para no obligar a tocar el bloque de Preview que aun lo referencia
  costos_horas?: CostoHoraOrdenServicio[];
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
