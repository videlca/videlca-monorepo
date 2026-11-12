import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsDate, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateValidarFechaOrdenServicioDto {

    @ApiProperty({ description: 'Fecha de actualizacion de la orden de servicio, se toma desde el front para tomar fecha del sistema', example: 'ISO String 2024-03-15T00:00:00.000Z', required: true})
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaActualizacion: Date;

    @ApiProperty({ description: 'Fecha de inicio de la orden de servicio', example: 'ISO String 2024-03-15T00:00:00.000Z', required: true})
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaInicio: Date;

    @ApiProperty({ description: 'Fecha de fin de la orden de servicio', example: 'ISO String 2024-03-15T00:00:00.000Z', required: false})
    @IsOptional()
    @Transform(({ value }) => value ? new Date(value) : null)
    @IsDate()
    fechaFin?: Date | null;

    // Si en la edicion tambien se cambiaron los dias de la semana de algun servicio (solo catalogo). Es solo para el
    // precheck: la actualizacion (updateOrdenServicio) vuelve a validar todo con los dias que realmente se envien
    @ApiProperty({ description: 'Indica si tambien se modificaron los dias de la semana de algun servicio', example: false, required: false})
    @IsOptional()
    @IsBoolean()
    cambioDias?: boolean;

}
