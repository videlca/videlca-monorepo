// Periodos / Tarifas

import type { Servicio } from "./servicio";

export interface Periodo {
  idPeriodo: number;
  nombre: string;
  mesInicio: number;
  anioInicio: number;
  mesFin: number;
  anioFin: number;
  fechaInicio: string;
  fechaFin: string;
  estado: boolean;
  periodoActivoFacturacion: boolean;
  tarifas: Tarifa[];
}

export interface Tarifa {
  idTarifa: number;
  idPeriodo: Periodo;
  idServicio: Servicio;
  idTipoTarifa: TipoTarifa;
  costosDirectos: number;
  seguroVida: number | null;
  costosDirectosSeguroVida: number;
  precioAntesIva: number;
  aui: number;
  iva: number;
  precioTotal: number;
  estado: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

// Tipo tarifa
export interface TipoTarifa {
  idTipoTarifa: number;
  nombre: string;
  descripcion: string;
  idTipoUnidadTiempo: {
    descripcion: string;
    estado: boolean;
    idTipoUnidadTiempo: number;
    requiereTiempo: boolean;
  };
  cantidadTiempo?: number;
}

// Tarifa hora descripcion (catalogo fijo de 4 categorias: diurna, diurna dominical/festiva, nocturna, nocturna dominical/festiva)
export interface TarifaHoraDescripcion {
  idTarifaHoraDescripcion: number;
  nombre: string;
  descripcion: string;
  dominical: boolean;
  diurno: boolean;
}

// Tarifa hora (valor por periodo de cada una de las 4 tarifa hora descripcion)
export interface TarifaHora {
  idTarifaHora: number | null;
  idPeriodo: Periodo;
  idTarifaHoraDescripcion: TarifaHoraDescripcion;
  costosDirectos: number | null;
  seguroVida: number | null;
  aui: number | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

// Respuesta de POST /tarifas/calcular-precios
export interface ServicioPrecioCalculado {
  idServicio: number;
  codigo: string;
  descripcion: string;
  idTipoHorarioDescripcion: number;
  tipoHorario: string;
  idTipoDuracion: number;
  tipoDuracion: string;
  idTipoTarifa: number;
  tipoTarifa: string;
  dominical: boolean;
  calculado: boolean;
  mensaje: string;
  costosDirectos: number | null;
  seguroVida: number | null;
  costosDirectosSeguroVida: number | null;
  aui: number | null;
  precioAntesIva: number | null;
  iva: number | null;
  precioTotal: number | null;
}

export interface CalcularPreciosResponse {
  calculados: ServicioPrecioCalculado[];
  manuales: ServicioPrecioCalculado[];
}

// Comparativa de periodos
export interface ComparativaPeriodosResponse {
  periodoA: ComparativaPeriodoInfo;
  periodoB: ComparativaPeriodoInfo;
  resumen: {
    cantidadServicios: ComparativaDiferencia;
    valorTotalTarifas: ComparativaDiferencia;
  };
  comparativa: {
    serviciosNuevos: ComparativaServicio[];
    serviciosEliminados: ComparativaServicio[];
    serviciosConCambioPrecio: ComparativaCambioPrecio[];
    ordenesPorServicio: ComparativaOrdenes[];
  };
}

export interface ComparativaPeriodoInfo {
  idPeriodo: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface ComparativaDiferencia {
  periodoA: number;
  periodoB: number;
  diferencia: number;
}

export interface ComparativaServicio {
  idServicio: number;
  nombreServicio: string;
  precio: number;
  cantidadOrdenes: number;
}

export interface ComparativaCambioPrecio {
  idServicio: number;
  nombreServicio: string;
  precioAnterior: number;
  precioNuevo: number;
  diferencia: number;
}

export interface ComparativaOrdenes {
  idServicio: number;
  nombreServicio: string;
  periodoA: { cantidadOrdenes: number };
  periodoB: { cantidadOrdenes: number };
  diferencia: number;
}