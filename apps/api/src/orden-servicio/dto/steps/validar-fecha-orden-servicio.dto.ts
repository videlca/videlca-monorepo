import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsDate } from 'class-validator';

export class ValidarFechasOrdenServicioDto {
    
    @ApiProperty({ description: 'Fecha de inicio de la orden de servicio', example: 'ISO String 2024-03-15T00:00:00.000Z', required: true})    
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaInicio: Date;
    
    @ApiProperty({ description: 'Fecha de fin de la orden de servicio', example: 'ISO String 2024-03-15T00:00:00.000Z', required: false}) 
    @IsOptional()   
    @Transform(({ value }) => value ? new Date(value) : null)
    @IsDate()
    fechaFin?: Date | null;

}