import { IsBoolean, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateGrupoLiquidacionEstadoDto {
  @IsNotEmpty()
  @IsIn(['consolidacion_orden', 'generacion_interfase', 'generacion_anexo'])
  campo: 'consolidacion_orden' | 'generacion_interfase' | 'generacion_anexo';

  @IsString()
  valor: string;
}