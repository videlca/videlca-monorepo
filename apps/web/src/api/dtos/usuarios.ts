export interface CreateUserDto {
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  email: string;
  clave?: string;
  numeroIdentificacion: string;
  idTipoIdentificacion: number;
  idRol: number;
}

export interface UpdateUserDto {
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  email?: string;
  clave?: string;
  numeroIdentificacion?: string;
  idTipoIdentificacion?: number;
}

export interface UpdateUserStatusDto {
  estado?: boolean;
  idRol?: number;
}