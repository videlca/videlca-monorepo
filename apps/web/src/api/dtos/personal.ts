export interface CreatePersonalDto {
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  numeroIdentificacion: string;
  idTipoIdentificacion: number;
  fechaInicioContrato: string;
  fechaFinContrato: string;
  fechaNacimiento: string;
  direccionResidencia: string;
  telefono: string;
  arma: boolean;
  idCiudad: number;
  idTipoGenero: number;
  idTipoPersonal: number;
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