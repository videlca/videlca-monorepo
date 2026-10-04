export interface ItemOrdenLiquidarDto {
  idOrdenServicio: number;
  anio: number;
  mes: number;
}

export interface ItemAdicionalLiquidarDto {
  idAdicional: number;
  anio: number;
  mes: number;
}

export interface CrearGrupoMensualDto {
  // Mes del grupo (el buscado); cada item lleva su propio anio/mes
  anio: number;
  mes: number;
  // Cliente al que pertenece este grupo de liquidacion (un grupo es siempre de un solo cliente)
  idCliente: number;
  ordenes?: ItemOrdenLiquidarDto[];
  adicionales?: ItemAdicionalLiquidarDto[];
}

export interface CreateGrupoLiquidacionDto {
  estado?: string;
  descripcion?: string;
  total?: number;
  consolidacion_orden?: boolean;
  generacion_interfase?: boolean;
  generacion_anexo?: boolean;
}

// tiposServicio es obligatorio: "monitoreo", "vigilancia" o ambos
export interface CompararLiquidacionesClienteDto {
  idCliente: number;
  anioA: number;
  mesA: number;
  anioB: number;
  mesB: number;
  tiposServicio: string;
}
