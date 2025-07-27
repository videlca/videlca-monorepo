import type { Tarifa } from "./periodo";

export interface Servicio {
  idServicio: number;
  codigo: string;
  descripcion: string;
  idTipoServicio: TipoServicio;
  idTipoDuracion: TipoDuracion;
  idTipoHorarioDescripcion: TipoHorarioDescripcion;
  horasFijas: number;
  horasMinimas: number;
  horasMaximas: number;
  estado: boolean;
  tarifas: Tarifa[];
}

// Interfaces relacionadas

export interface TipoServicio {
  idTipoServicio: number;
  nombre: string;
  descripcion: string;
  requierePersonal: boolean;
  estado: boolean;
}

export interface TipoDuracion {
  idTipoDuracion: number;
  descripcion: string;
  estado: boolean;
  // servicios: Servicio[];
}

export interface TipoHorarioDescripcion {
  idTipoHorarioDescripcion: number;
  descripcion: string;
  estado: boolean;
  servicios: Servicio[];
  horarios: TipoHorario[];
}

export interface TipoHorario {
  idTipoHorario: number;
  idTipoHorarioDescripcion: TipoHorarioDescripcion;
  horaInicio: string;
  horaFin: string;
  fechaVigenciaInicio: string;
  fechaVigenciaFin: string | null;
  estado: boolean;
}


