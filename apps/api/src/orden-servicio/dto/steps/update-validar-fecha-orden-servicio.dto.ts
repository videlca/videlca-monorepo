import { ApiProperty } from "@nestjs/swagger";
import { IsDate } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateValidarFechaOrdenServicioDto {

    @ApiProperty({ description: 'Fecha de actualizacion de la orden de servicio, se toma desde el front para tomar fecha del sistema', example: 'ISO String 2024-03-15T00:00:00.000Z', required: true})    
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaActualizacion: Date;

    @ApiProperty({ description: 'Fecha de inicio de la orden de servicio', example: 'ISO String 2024-03-15T00:00:00.000Z', required: false})    
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaInicio: Date;
    
    @ApiProperty({ description: 'Fecha de fin de la orden de servicio', example: 'ISO String 2024-03-15T00:00:00.000Z', required: false}) 
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaFin: Date;

}
