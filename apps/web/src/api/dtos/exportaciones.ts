export type TipoDocumento = 'consolidacion_orden' | 'generacion_interfase' | 'generacion_anexo'

export interface FiltroGrupoLiquidacionDto {
  campo: TipoDocumento;
  valor: string;
  anio?: number;
  mes?: number;
}

export interface UpdateGrupoLiquidacionEstadoDto {
  campo: TipoDocumento;
  valor: string;
}