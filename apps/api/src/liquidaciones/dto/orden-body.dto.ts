import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNumber, IsPositive } from "class-validator";

export class OrdenBody {

    @ApiProperty({
        description: 'ID de la orden de servicio a la que pertenece la liquidación',
        example: 2025,
    })
    @IsInt({ message: 'El número del año debe ser un número entero' })
    anio: number;

    @ApiProperty({
        description: 'ID de la orden de servicio a la que pertenece la liquidación',
        example: 2025,
    })
    @IsInt({ message: 'El número del año debe ser un número entero' })
    mes: number;

}
