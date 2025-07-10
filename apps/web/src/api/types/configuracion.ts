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