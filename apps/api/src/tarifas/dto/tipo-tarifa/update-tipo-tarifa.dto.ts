import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, Max, Min } from 'class-validator';

export class UpdateTipoTarifaDto {

    @ApiProperty({ description: 'Cantidad de tiempo que representa el tipo de unidad de tiempo', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo cantidad de tiempo debe ser un número'})
    @IsPositive({message: 'El valor del campo cantidad de tiempo debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo cantidad de tiempo debe ser minimo 1'})
    @Max(31, {message: 'El valor del campo cantidad de tiempo debe ser maximo 31'})
    cantidadTiempo: number;

}
