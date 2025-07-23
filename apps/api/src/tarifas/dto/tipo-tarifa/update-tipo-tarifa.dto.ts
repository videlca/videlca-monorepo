import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class UpdateTipoTarifaDto {

    @ApiProperty({ description: 'Cantidad de tiempo que representa el tipo de unidad de tiempo', example: 1, required:true})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo cantidad de tiempo debe ser un número'})
    @IsPositive({message: 'El valor del campo cantidad de tiempo debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo cantidad de tiempo debe ser minimo 1'})
    cantidadTiempo?: number;

}
