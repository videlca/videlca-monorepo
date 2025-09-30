export interface PaginationDto {
  limit?: number
  offset?: number
  pagination?: boolean | null
}

// enviar pdf por correo
export interface CorreosDto {
  email: string;
}

export interface EnviarCorreoDto {
  correos: CorreosDto[];
}