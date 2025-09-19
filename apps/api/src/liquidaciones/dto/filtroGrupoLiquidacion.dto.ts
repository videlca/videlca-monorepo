import { IsBoolean, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FiltroGrupoLiquidacionDto {
  @ApiProperty({
    enum: ['consolidacion_orden', 'generacion_interfase', 'generacion_anexo'],
    description: 'Campo booleano del grupo de liquidación',
  })
  @IsIn(['consolidacion_orden', 'generacion_interfase', 'generacion_anexo'])
  campo: 'consolidacion_orden' | 'generacion_interfase' | 'generacion_anexo';

  @ApiProperty({
    description: 'Valor booleano',
    type: Boolean,
    example: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  valor: boolean;
}