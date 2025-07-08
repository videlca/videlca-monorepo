export interface loginUserDto {
  email: string
  clave: string
}

export interface ReestablecerDatosDto {
  nroIdentificacion: string
}

export interface NewPasswordDto {
  clave: string
  confirmarClave: string
}