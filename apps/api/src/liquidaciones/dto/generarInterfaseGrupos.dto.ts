import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt, IsPositive } from 'class-validator';

export class GenerarInterfaseGruposDto {

  @ApiProperty({ description: 'Ids de los grupos de liquidacion que van en el archivo de interfase', example: [89, 96], required: true })
  @IsArray({ message: 'El campo grupos de liquidacion debe ser un arreglo' })
  @ArrayNotEmpty({ message: 'Debe indicar al menos un grupo de liquidacion' })
  @IsInt({ each: true, message: 'Cada grupo de liquidacion debe ser un número entero' })
  @IsPositive({ each: true, message: 'Cada grupo de liquidacion debe ser un numero positivo' })
  idsGrupoLiquidacion: number[];

}
