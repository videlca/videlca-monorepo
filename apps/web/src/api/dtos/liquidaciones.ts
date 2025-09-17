export interface CrearGrupoMensualDto {
  anio: number;
  mes: number;
  ordenIds: number[];
}

export interface CreateGrupoLiquidacionDto {
  estado?: string;
  descripcion?: string;
  total?: number;
  consolidacion_orden?: boolean;
  generacion_interfase?: boolean;
  generacion_anexo?: boolean;
}
