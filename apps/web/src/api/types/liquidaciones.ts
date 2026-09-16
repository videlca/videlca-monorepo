import type { OrdenServicio, OrdenServicioDetalle } from "./orden-servicio";


export interface GruposLiquidaciones {
  idGrupoLiquidacion: number;
  estado: boolean;
  total: number;
  descripcion: string;
  fechaCreacion: string;
  consolidacion_orden: boolean;
  generacion_interfase: boolean;
  generacion_anexo: boolean;
  liquidaciones: Liquidaciones[];
}

export interface Liquidaciones {
  idLiquidacion: number;
  valor_liquidacion: number;
  // Suma de precioAntesIva de las lineas de servicio de esta liquidacion (ver buscarGrupoLiquidaciones
  // en el backend); valor_liquidacion ya es el total CON iva
  valorLiquidacionAntesIva: number;
  fechaCreacion: string;
  idServicioOrden: number;
  ordenServicio: OrdenServicio;
  idGrupoLiquidacion: number;
  estado: boolean;
  grupo: GruposLiquidaciones;
  aniomes_liquidacion: string;
}

// Pagina de liquidaciones de una orden especifica (GET /orden-servicio/:ordenId/liquidaciones). No usa el
// PaginatedResponse<T> generico del resto del front: el backend de liquidaciones devuelve esta forma propia
// (ver findAll en liquidaciones.service.ts)
export interface LiquidacionesOrdenPage {
  items: Liquidaciones[];
  total: number;
  page: number;
  limit: number;
}

// Fila del desglose que devuelve GET /liquidaciones/:idLiquidacion/orden. Es mas angosta que
// OrdenServicioDetalle: no trae idOrdenServicioDetalle, cantidadHoras, ni los dias de la semana/incluyeFestivos
// (ver findOrdenLiquidada en el backend, arma el desglose a mano y no copia esos campos)
export type LiquidacionOrdenDetalle = Omit<
  OrdenServicioDetalle,
  | "idOrdenServicioDetalle"
  | "cantidadHoras"
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado"
  | "domingo"
  | "incluyeFestivos"
> & {
  idOrdenServicioDetalle?: number;
  cantidadHoras?: number | null;
  lunes?: boolean;
  martes?: boolean;
  miercoles?: boolean;
  jueves?: boolean;
  viernes?: boolean;
  sabado?: boolean;
  domingo?: boolean;
  incluyeFestivos?: boolean;
};

// Respuesta de GET /liquidaciones/:idLiquidacion/orden: misma forma que el findOne normal de una orden
// (OrdenServicio: cliente, locacion, correos, estado, usuario, etc), pero con fechaInicio/fechaFin acotados al
// tramo de ese mes especifico, precioTotal = lo realmente liquidado ese mes (no el total de toda la orden), y
// detalles = el desglose de servicios facturados ese mes. Se usa para alimentar el mismo componente que ya
// muestra el detalle de una orden (OrdenDetalles), en vez de duplicarlo
export type OrdenLiquidada = Omit<OrdenServicio, "detalles" | "liquidaciones"> & {
  detalles: LiquidacionOrdenDetalle[];
  idLiquidacion: number;
  aniomes_liquidacion: string;
};
