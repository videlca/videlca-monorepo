import type { OrdenServicio, OrdenServicioDetalle } from "./orden-servicio";
import type { Adicional, TipoAdicional } from "./adicionales";
import type { Cliente, Usuario } from "../../types";


export interface GruposLiquidaciones {
  idGrupoLiquidacion: number;
  // Cliente al que pertenece el grupo. Null en grupos historicos creados antes de esta relacion (algunos de
  // esos mezclaban varios clientes en un mismo grupo); todo grupo nuevo siempre lo trae (ver CrearGrupoMensualDto)
  idCliente: Pick<Cliente, "idCliente" | "nombre"> | null;
  estado: boolean;
  total: number;
  descripcion: string;
  fechaCreacion: string;
  consolidacion_orden: boolean;
  generacion_interfase: boolean;
  generacion_anexo: boolean;
  liquidaciones: Liquidaciones[];
  // Solo con lo filtrado por tiposServicio; `total` sigue siendo el total completo de la factura
  totalFiltrado?: number;
  totalAntesIvaFiltrado?: number;
}

export type TipoServicioFiltro = "monitoreo" | "vigilancia";

// Una misma orden/adicional sale una vez por mes pendiente: el id solo no es unico, usar id + aniomesLiquidar
export interface LiquidarMesInfo {
  anioLiquidar: number;
  mesLiquidar: number;
  aniomesLiquidar: string;
  esMesAnterior: boolean;
}

export type OrdenPorMes = OrdenServicio & LiquidarMesInfo;
export type AdicionalPorMes = Adicional & LiquidarMesInfo;

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
  tipoServicio?: "monitoreo" | "vigilancia" | "adicional";
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
  idTipoAdicional: TipoAdicional;
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

export interface GrupoComparacion {
  idGrupoLiquidacion: number;
  descripcion: string;
  fechaCreacion: string;
  cantidadOrdenes: number;
  cantidadAdicionales: number;
  totalAntesIva: number;
  totalIva: number;
  totalConIva: number;
}

export interface PeriodoComparacion {
  anio: number;
  mes: number;
  aniomes: string;
  cantidadGrupos: number;
  cantidadOrdenes: number;
  cantidadLiquidacionesOrdenes: number;
  cantidadAdicionales: number;
  totalAntesIva: number;
  totalIva: number;
  totalConIva: number;
  grupos: GrupoComparacion[];
}

export interface DiferenciaMetrica {
  valor: number;
  // null cuando el valor de A es 0 (sin base para el porcentaje)
  porcentaje: number | null;
}

export interface DiferenciaComparacion {
  cantidadGrupos: DiferenciaMetrica;
  cantidadOrdenes: DiferenciaMetrica;
  cantidadLiquidacionesOrdenes: DiferenciaMetrica;
  cantidadAdicionales: DiferenciaMetrica;
  totalAntesIva: DiferenciaMetrica;
  totalIva: DiferenciaMetrica;
  totalConIva: DiferenciaMetrica;
}

export interface ComparacionCliente {
  cliente: {
    idCliente: number;
    nombre: string;
    numeroIdentificacion: string;
  };
  tiposServicio: TipoServicioFiltro[];
  periodoA: PeriodoComparacion;
  periodoB: PeriodoComparacion;
  diferencia: DiferenciaComparacion;
}
