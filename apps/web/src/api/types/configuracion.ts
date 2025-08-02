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

export interface ActualizarTipoPersonal extends Partial<CreateTipoPersonal> {
  estado: boolean
}

// Tipo de cliente
export interface CreateTipoCliente {
  descripcion: string
}

export interface ActualizarTipoCliente extends Partial<CreateTipoCliente> {
  estado: boolean
}

// Tipo identificacion
export interface CreateTipoIdentificacion {
  descripcion: string
}

export interface ActualizarTipoIdentificacion extends Partial<CreateTipoIdentificacion> {
  estado: boolean
}

// Tipo genero
export interface CreateTipoGenero {
  descripcion: string
}

export interface ActualizarTipoGenero extends Partial<CreateTipoGenero> {
  estado: boolean
}

export interface CreateTipoNovedad {
  descripcion: string
}

export interface ActualizarTipoNovedad extends Partial<CreateTipoNovedad> {
  estado: boolean
}