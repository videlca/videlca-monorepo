export interface CreateOrdenServicioDto {
  idLocacion: number;
  idTarifa: number;
  cantidadPersonal: number;
  fechaInicio: string;
  fechaFin: string | null;
  horaInicio: string;
  horaFin: string;
  fechaCreacion: string;
}

export interface TercerPasoDto {
  idTarifa: number;
  fechaInicio: string;
  fechaFin: string | null;
  horaInicio: string | null;
  horaFin: string | null;
  horasDescanso: number;
}

export interface PrecioOrdenDto {
  idTarifa: number;
  horaInicio: string | null;
  horaFin: string | null;
  horasDescanso: number;
  cantidadPersonal: number | null;
  fechaInicio: string;
  fechaFin: string | null;
}

export interface CreateObservacionOrdenServicioDto {
  descripcion: string;
  idOrdenServicio: number;
}

export interface UpdateObservacionOrdenServicioDto {
  descripcion: string;
}
