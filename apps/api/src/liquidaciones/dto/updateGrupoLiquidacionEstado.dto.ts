import { IsBoolean, IsIn, IsNotEmpty } from 'class-validator';

export class UpdateGrupoLiquidacionEstadoDto {
  @IsNotEmpty()
  @IsIn(['consolidacion_orden', 'generacion_interfase', 'generacion_anexo'])
  campo: 'consolidacion_orden' | 'generacion_interfase' | 'generacion_anexo';

  @IsBoolean()
  valor: boolean;
}