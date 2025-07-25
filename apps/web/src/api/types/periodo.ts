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
  precioSinIva: number;
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