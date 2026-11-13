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

// Filter
export enum UserFilterColumn {
  NUMERO_IDENTIFICACION = 'numeroIdentificacion',
  NOMBRE = 'nombre',
  EMAIL = 'email',
  ROL = 'rol',
}

export interface FilterUserDto {
  column: UserFilterColumn;
  query: string;
  limit?: number;
  offset?: number;
  pagination?: boolean;
}

// Cambio de contraseña desde el perfil: se confirma la actual y se escribe la nueva dos veces
export interface CambiarClaveDto {
  claveActual: string;
  claveNueva: string;
  confirmarClaveNueva: string;
}
