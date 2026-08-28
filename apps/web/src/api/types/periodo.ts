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

// Tarifa hora (valor por periodo de cada una de las 5 tarifa hora descripcion)
export interface TarifaHora {
  idTarifaHora: number | null;
  idPeriodo: Periodo;
  idTarifaHoraDescripcion: TarifaHoraDescripcion;
  precio: number | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

// Respuesta de POST /tarifas/calcular-precios: un elemento por cada servicio enviado, en el mismo orden
export interface ServicioPrecioCalculado {
  idServicio: number;
  codigo: string;
  descripcion: string;
  idTipoServicio: number;
  tipoServicio: string;
  idTipoHorarioDescripcion: number;
  tipoHorario: string;
  idTipoTarifa: number;
  tipoTarifa: string;
  horasFijas: number;
  dominical: boolean;
  armado: boolean;
  costosDirectos: number;
  seguroVida: number;
  costosDirectosSeguroVida: number;
  aui: number;
  precioAntesIva: number;
  iva: number;
  precioTotal: number;
}

export type CalcularPreciosResponse = ServicioPrecioCalculado[];

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