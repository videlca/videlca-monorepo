export interface OrdenServicio {
  idOrdenServicio: number;
  idUsuarioCreacion: number;
  idEstadoOrdenServicio: number;
  idLocacion: number;
  idTarifa: number;
  cantidadPersonal: number;
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  fechaCreacion: string;
}