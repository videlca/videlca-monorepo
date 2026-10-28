import type { Tarifa, TipoTarifa } from "./periodo";

export interface Servicio {
  idTarifa: Tarifa;
  idServicio: number;
  codigo: string;
  descripcion: string;
  idTipoServicio: TipoServicio;
  idTipoDuracion: TipoDuracion;
  idTipoHorarioDescripcion: TipoHorarioDescripcion;
  idTipoTarifa: TipoTarifa;
  horasFijas: number;
  horasMinimas: number;
  horasMaximas: number;
  dominical: boolean;
  estado: boolean;
  // Orden al crear una orden de servicio, relativo a su tipo de servicio (null = sin orden, va al final).
  // El backend ya devuelve las tarifas ordenadas por este campo
  displayOrder?: number | null;
  tarifas: Tarifa[];
}

// Interfaces relacionadas

export interface TipoServicio {
  idTipoServicio: number;
  nombre: string;
  prefijo: string;
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
  nombre: string;
  descripcion: string;
  estado: boolean;
}

export interface TipoHorario {
  idTipoHorario: number;
  horaInicioDiurno: string;
  horaFinDiurno: string;
  horaInicioNocturno: string;
  horaFinNocturno: string;
  fechaVigenciaInicio: string;
  fechaVigenciaFin: string | null;
  estado: boolean;
}


