import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
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

  // FILTRO OPCIONAL POR MES DEL GRUPO (el mes que se liquido, el de la descripcion "liquidacion_{mes}_{anio}_{id}").
  // anio y mes van juntos: o se envian los dos o ninguno (validado en el servicio)
  @ApiProperty({ description: 'Año del grupo de liquidación (junto con mes)', example: 2026, required: false })
  @IsOptional()
  @Type(() => Number) @IsInt({ message: 'El campo anio debe ser un número entero' }) @Min(2000)
  anio?: number;

  @ApiProperty({ description: 'Mes del grupo de liquidación, 1-12 (junto con anio)', example: 9, required: false })
  @IsOptional()
  @Type(() => Number) @IsInt({ message: 'El campo mes debe ser un número entero' }) @Min(1) @Max(12)
  mes?: number;
}
