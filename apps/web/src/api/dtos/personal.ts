export interface CreatePersonalDto {
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  numeroIdentificacion: string;
  idTipoIdentificacion: number;
  fechaActual: string;
  fechaInicioContrato: string;
  fechaFinContrato: string | null;
  fechaNacimiento: string;
  direccionResidencia: string;
  telefono: string;
  arma: boolean;
  idCiudad: number;
  idTipoGenero: number;
  idTipoPersonal: number;
  idTipoContrato: number;
}

export interface UpdatePersonalDto extends Partial<CreatePersonalDto> {
  laborando?: boolean;
}


export interface CreateNovedadDto {
  descripcion: string;
  fechaInicio: string;
  horaInicio: string;
  fechaFin: string;
  horaFin: string;
  idTipoNovedad: number;
}

export interface UpdateNovedadDto extends Partial<CreateNovedadDto> {}