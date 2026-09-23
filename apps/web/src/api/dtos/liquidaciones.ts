export interface CrearGrupoMensualDto {
  anio: number;
  mes: number;
  // Cliente al que pertenece este grupo de liquidacion (un grupo es siempre de un solo cliente)
  idCliente: number;
  ordenIds?: number[];
  adicionalIds?: number[];
}

export interface CreateGrupoLiquidacionDto {
  estado?: string;
  descripcion?: string;
  total?: number;
  consolidacion_orden?: boolean;
  generacion_interfase?: boolean;
  generacion_anexo?: boolean;
}
