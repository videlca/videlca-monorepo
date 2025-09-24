import type { SubSegmentacion } from "../types";

// Segmentación
export interface CreateSegmentacionDto {
  descripcion: string;
  subSegmentaciones: SubSegmentacion[];
}

export interface UpdateSegmentacionDto {
  estado?: boolean;
  descripcion?: string;
}


export interface CreateSubSegmentacionDto {
  descripcion: string;
}

export interface UpdateSubSegmentacionDto {
  descripcion?: string;
  estado?: boolean;
}

// Puestos
export interface CreatePuestoDto {
  nombre: string;
  idCiudad: number;
  direccion: string;
  latitud: number;
  longitud: number;
  primerNombreResponsable: string;
  primerApellidoResponsable: string;
  telefono: string;
  segundoTelefono?: string;
  diasAnticipaticionNotificacion: number;
  idCliente: number;
  correos: CreateCorreoDto[];
}

export interface UpdatePuestoDto extends Partial<CreatePuestoDto> {
  estado?: boolean;
}

export interface CreateCorreoDto {
  nombre: string;
  apellido: string;
  email: string;
  estados: number[];
  // estadosApp?: string[];
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
  numeroIdentificacion?: string;
  idTipoIdentificacion?: number;
  nombre?: string;
  idTipoCliente?: number;
  idSubSegmentacion?: number;
  estado?: boolean;
}


