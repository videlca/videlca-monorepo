import { IsBoolean, IsIn, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FiltroGrupoLiquidacionDto {
  @ApiProperty({
    enum: ['consolidacion_orden', 'generacion_interfase', 'generacion_anexo'],
    description: 'Campo booleano del grupo de liquidación',
  })
  @IsIn(['consolidacion_orden', 'generacion_interfase', 'generacion_anexo'])
  campo: 'consolidacion_orden' | 'generacion_interfase' | 'generacion_anexo';

  @ApiProperty({
    description: 'Valor booleano (acepta "true"/"false" como string)',
    type: String,
    example: 'true',
  })
  @IsString()
  valor: string;
}