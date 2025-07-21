import type { SubSegmentacion } from "../types";

// Segmentación
export interface CreateSegmentacionDto {
  descripcion: string;
  subSegmentaciones: SubSegmentacion[];
}

export interface UpdateSegmentacionDto {
  estado?: boolean;
}

// Locaciones
export interface CreateLocacionDto {
  nombre: string;
  idCiudad: number;
  direccion: string;
  latitud: number;
  longitud: number;
  primerNombreResponsable: string;
  primerApellidoResponsable: string;
  telefono: string;
  segundoTelefono?: string;
  diasAnticipacionNotificacion: number;
  idCliente: number;
  correos: CreateCorreoDto[];
}

export interface UpdateLocacionDto {
  estado?: boolean;
}

export interface CreateCorreoDto {
  nombre: string;
  apellido: string;
  email: string;
  estados: number[];
}

// Clientes
export interface CreateClienteDto {
  numeroIdentificacion: string;
  idTipoIdentificacion: number;
  nombre: string;
  idTipoCliente: number;
  idSubSegmentacion: number;
}

export interface UpdateClienteDto {
  estado?: boolean;
}


