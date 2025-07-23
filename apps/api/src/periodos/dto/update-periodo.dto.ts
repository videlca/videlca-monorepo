import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsDateString, IsOptional, IsBoolean } from "class-validator";
import { Transform } from 'class-transformer';

export class UpdatePeriodoDto {
    
    @ApiProperty({ description: 'Fecha de inicio del periodo', example: 'ISO String 2024-03-15T00:00:00.000Z', required: true})    
    @IsNotEmpty()
    @IsDateString()
    @Transform(({ value }) => new Date(value))
    fechaInicio: Date;

    @ApiProperty({ description: 'Fecha de Fin del periodo', example: 'ISO String 2024-03-15T00:00:00.000Z', required: true})    
    @IsNotEmpty()
    @IsDateString()
    @Transform(({ value }) => new Date(value))
    fechaFin: Date;
    
    @ApiProperty({ 
        description: 'Identificador del estado para saber si el periodo a crear sera el periodo activo de facturacion', 
        example: true, 
        required: true
    })
    @IsBoolean({message: 'El campo periodoActivoFacturacion debe ser boolean'})
    periodoActivoFacturacion: boolean;
    
}
