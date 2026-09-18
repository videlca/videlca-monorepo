import type { OrdenServicio, OrdenServicioDetalle } from "./orden-servicio";
import type { Adicional } from "./adicionales";
import type { Cliente, Usuario } from "../../types";


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

// Respuesta real de POST /liquidaciones/generar-mes: el GrupoLiquidacion recien creado y guardado tal cual,
// sin su relacion `liquidaciones` (no se vuelve a consultar con relaciones despues de guardar)
export type GrupoLiquidacionCreado = Omit<GruposLiquidaciones, "liquidaciones">;

export interface Liquidaciones {
  idLiquidacion: number;
  valor_liquidacion: number;
  // Suma de precioAntesIva de las lineas de servicio de esta liquidacion (ordenes) o el precioAntesIva
  // snapshot de la liquidacion misma (adicionales) - ver buscarGrupoLiquidaciones en el backend;
  // valor_liquidacion ya es el total CON iva
  valorLiquidacionAntesIva: number;
  fechaCreacion: string;
  idServicioOrden: number;
  // Exactamente uno de estos dos pares esta poblado por fila, nunca ambos ni ninguno
  idOrdenServicio: number | null;
  ordenServicio: OrdenServicio | null;
  idAdicional: number | null;
  adicional: Adicional | null;
  // Snapshot del desglose de precio, solo poblado cuando la fila es de un adicional (null para ordenes)
  costosDirectos: number | null;
  seguroVida: number | null;
  aui: number | null;
  precioAntesIva: number | null;
  iva: number | null;
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

// Respuesta de GET /liquidaciones/:idLiquidacion/orden cuando la liquidacion es de una orden de servicio:
// misma forma que el findOne normal de una orden (OrdenServicio: cliente, locacion, correos, estado, usuario,
// etc), pero con fechaInicio/fechaFin acotados al tramo de ese mes especifico, precioTotal = lo realmente
// liquidado ese mes (no el total de toda la orden), y detalles = el desglose de servicios facturados ese mes.
// Se usa para alimentar el mismo componente que ya muestra el detalle de una orden (OrdenDetalles)
export type OrdenLiquidada = Omit<OrdenServicio, "detalles" | "liquidaciones"> & {
  tipo: "orden";
  detalles: LiquidacionOrdenDetalle[];
  idLiquidacion: number;
  aniomes_liquidacion: string;
};

// Respuesta de GET /liquidaciones/:idLiquidacion/orden cuando la liquidacion es de un adicional: forma plana,
// sin detalles ni relaciones de orden. costosDirectos/seguroVida/aui/precioAntesIva/iva son el snapshot
// guardado en la liquidacion (no el estado actual del Adicional, que puede haber cambiado desde entonces)
export interface AdicionalLiquidado {
  tipo: "adicional";
  idLiquidacion: number;
  aniomes_liquidacion: string;
  idAdicional: number;
  nombre: string;
  idCliente: Cliente;
  idUsuarioCreacion: Usuario;
  mesInicio: string;
  mesFin: string | null;
  costosDirectos: number | null;
  seguroVida: number | null;
  aui: number | null;
  precioAntesIva: number | null;
  iva: number | null;
  precioTotal: number;
}

// Union discriminada de la respuesta de GET /liquidaciones/:idLiquidacion/orden - siempre trae `tipo`
export type OrdenOAdicionalLiquidado = OrdenLiquidada | AdicionalLiquidado;
