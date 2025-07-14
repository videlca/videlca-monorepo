// Estados de orden
export interface UpdateEstadoOrdenDto {
  dias: number
}

export interface UpdateTipoPersonalDto {
  estado: boolean
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