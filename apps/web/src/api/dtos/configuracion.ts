
// Estados de orden
export interface CreateEstadoOrdenDto {
  nombre: string
  descripcion: string
}

export interface UpdateEstadoOrdenDto {
  estado: boolean
}

export interface UpdateTipoPersonalDto {
  descripcion?: string
  estado?: boolean
}

// Ubicaciones
export interface CreateCiudadDto {
  descripcion: string
  departamento: number
  codigoCiudad: string
}

export interface UpdateCiudadDto {
  descripcion?: string
  departamento?: number
  codigoCiudad?: string
  estado?: boolean
}

export interface CreatePaisDto {
  descripcion: string
}

export interface UpdatePaisDto {
  descripcion?: string
}

export interface CreateDepartamentoDto {
  descripcion: string
  pais: number
  codigoDepartamento: string
}

export interface UpdateDepartamentoDto {
  descripcion?: string
  pais?: number
  codigoDepartamento?: string
}

// Tipo contrato
export interface CreateTipoContrato {
  descripcion: string
  indefinido: boolean
}

export interface ActualizarTipoContrato extends Partial<CreateTipoContrato> {
  estado: boolean
}

// Correos por defecto
export interface CreateCorreoDefaultDto {
  descripcion: string
  email: string
  estados: number[]
  estadosApp: number[]
}

export interface CorreoDefaultDto {
  correos: CreateCorreoDefaultDto[]
}

// Puestos

export type ColumnaPuesto = 'nombre' | 'direccion' | 'cliente';

export interface SearchPuestosDto {
  column: ColumnaPuesto
  text: string
}