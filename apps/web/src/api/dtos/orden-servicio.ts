export interface CreateOrdenServicioDto {
  idLocacion: number;
  idTarifa: number;
  cantidadPersonal: number;
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  fechaCreacion: string;
}

export interface TercerPasoDto {
  idTarifa: number;
  horaInicio: string;
  horaFin: string;
}