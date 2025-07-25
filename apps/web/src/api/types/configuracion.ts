// Estados de orden
export interface CrearEstadoOrden {
  descripcion: string
}

export interface ActualizarEstadoOrden {
  dias: number;
}

// Tipo de personal
export interface CreateTipoPersonal {
  descripcion: string
}

export interface ActualizarTipoPersonal {
  estado: boolean
}

// Tipo de cliente
export interface CreateTipoCliente {
  descripcion: string
}

export interface ActualizarTipoCliente {
  estado: boolean
}

// Tipo identificacion
export interface CreateTipoIdentificacion {
  descripcion: string
}

export interface ActualizarTipoIdentificacion {
  estado: boolean
}

// Tipo genero
export interface CreateTipoGenero {
  descripcion: string
}

export interface ActualizarTipoGenero {
  estado: boolean
}

export interface CreateTipoNovedad {
  descripcion: string
}

export interface ActualizarTipoNovedad {
  estado: boolean
}