import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNumber, IsPositive } from "class-validator";

export class CreateLiquidacioneDto {

  @ApiProperty({
    description: 'ID de la orden de servicio a la que pertenece la liquidación',
    example: 1,
  })
  @IsInt({ message: 'El idOrdenServicio debe ser un número entero' })
  idOrdenServicio: number;

  @ApiProperty({
    description: 'Valor monetario de la liquidación',
    example: 1500000.50,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El valor_liquidacion debe ser un número con hasta 2 decimales' })
  @IsPositive({ message: 'El valor_liquidacion debe ser positivo' })
  valor_liquidacion: number;
}
