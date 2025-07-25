import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsDate } from "class-validator";
import { Transform } from 'class-transformer';

export class CreatePeriodoDto {
    
    @ApiProperty({ description: 'Fecha de inicio del periodo', example: 'ISO String 2024-03-15T00:00:00.000Z', required: true})    
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaInicio: Date;

    @ApiProperty({ description: 'Fecha de Fin del periodo', example: 'ISO String 2024-03-15T00:00:00.000Z', required: true})    
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaFin: Date;
    
    @ApiProperty({ 
        description: 'Identificador del estado para saber si el periodo a crear sera el periodo activo de facturacion', 
        example: true, 
        required: true
    })
    @IsBoolean({message: 'El campo periodoActivoFacturacion debe ser boolean'})
    periodoActivoFacturacion: boolean;
    
}
