import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive } from "class-validator";
import { Type } from "class-transformer";
import { PaginationDto } from "../../../common/dto";

export class FindAdicionalesDto extends PaginationDto {

    @ApiProperty({ description: 'Filtrar los adicionales de un cliente en especifico', example: 1, required: false })
    @IsOptional()
    @IsNumber({}, { message: 'El valor del campo cliente debe ser un número' })
    @IsPositive({ message: 'El valor del campo cliente debe ser un numero positivo' })
    @Type(() => Number)
    idCliente?: number;

}
