
export interface CreateOrdenServicioDto {
  numeroOrdenServicio: string;
  idLocacion: number;
  fechaInicio: string;
  fechaFin: string | null;
  precioTotal: number;
  fechaCreacion: string;
  servicios: CreateOrdenServicioTarifaDto[];
}

export interface CreateOrdenServicioTarifaDto {
  idTarifa: number;
  idServicio?: number;
  cantidadPersonal: number;
  horaInicio: string;
  horaFin: string;
  precio: number;
  personal: CreatePersonalServicioDto[];
}

export interface CreatePersonalServicioDto {
  idPersonal: number;
  horaInicio: string;
  horaFin: string;
}

export interface ValidarFechasOrdenServicioDto {
  fechaInicio: string;
  fechaFin: string | null;
}

export interface ValidarHorarioServicioDto {
  idTarifa: number;
  idServicio: number;
  horaInicio: string;
  horaFin: string;
}

export interface PrecioOrdenDto {
  idTarifa: number;
  idServicio: number;
  horaInicio: string | null;
  horaFin: string | null;
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

export interface ValidarIdOrdenServicioDto {
  descripcionId: string;
}

// orden servicio personal
export interface ValidarEmpleadosDisponiblesDto {
  fechaInicio: string;
  fechaFin: string | null;
  horaInicio: string;
  horaFin: string;
}

export interface ValidarRangoHorarioPersonalOrdenDto {
  horaInicio: string;
  horaFin: string;
  personal: CreatePersonalServicioDto[];
}

// orden de servicio id
export interface UpdateOrdenServicioIdDto {
  descripcionId: string;
}

export interface AnularIdOrdenServicioDto {
  descripcionId: string;
}