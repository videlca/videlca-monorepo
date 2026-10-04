import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsDate, IsString, IsNotEmpty, MaxLength, Matches, IsArray, ValidateNested, IsNumber, IsPositive, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// SOLO SE USA CUANDO LA ORDEN ES DE ORIGEN "catalogo" Y LA NUEVA FECHA FIN NO ES NULL: EL HORARIO DE CADA SERVICIO
// YA EXISTENTE EN LA ORDEN (NO SE PUEDEN AGREGAR/QUITAR SERVICIOS, SOLO REENVIAR SU HORARIO PARA RECALCULAR EL PRECIO
// CON LAS NUEVAS FECHAS)
export class UpdateOrdenServicioDetalleDto {

    @ApiProperty({ description: 'Id de la tarifa de este servicio (debe ser uno de los que ya tiene la orden)', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo tarifa debe ser un número'})
    @IsPositive({message: 'El valor del campo tarifa debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo tarifa debe ser minimo 1'})
    idTarifa: number;

    @ApiProperty({ description: 'Hora de inicio de este servicio', example: '06:00:00', required:true})
    @IsString({ message: 'El campo Hora de inicio debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de inicio no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de inicio no puede exceder los 8 caracteres' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'horaInicio debe tener formato HH:mm:ss'
    })
    horaInicio: string;

    @ApiProperty({ description: 'Hora de finalizacion de este servicio', example: '18:00:00', required:true})
    @IsString({ message: 'El campo Hora de fin debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de fin no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de fin no puede exceder los 8 caracteres' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'horaFin debe tener formato HH:mm:ss'
    })
    horaFin: string;

}

export class UpdateOrdenServicioDto {

    @ApiProperty({ description: 'Fecha de inicio de la orden de servicio', example: 'ISO String 2024-03-15T00:00:00.000Z', required: true})
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaInicio: Date;

    @ApiProperty({ description: 'Fecha de fin de la orden de servicio', example: 'ISO String 2024-03-15T00:00:00.000Z', required: false})
    @IsOptional()
    @Transform(({ value }) => value ? new Date(value) : null)
    @IsDate()
    fechaFin?: Date | null;

    @ApiProperty({ description: 'Fecha de Actualizacion de la orden de servicio, se toma desde el front para tomar fecha del sistema', example: 'ISO String 2024-03-15T00:00:00.000Z', required: true})
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaActualizacion: Date;

    // CATALOGO: se debe reenviar el horario de cada servicio ya existente en la orden, para poder recalcular su
    // precio con las nuevas fechas. Solo obligatorio si la orden es de origen "catalogo" y la nueva fecha fin no es null
    @ApiProperty({
        description: 'Horario de cada servicio de la orden. Obligatorio y unicamente aplica cuando la orden es de origen "catalogo" y la nueva fecha fin no es null',
        type: [UpdateOrdenServicioDetalleDto],
        required: false
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateOrdenServicioDetalleDto)
    servicios?: UpdateOrdenServicioDetalleDto[];

    // A LA MEDIDA: estos valores no cambian el "horario" en si, solo son necesarios para recalcular el precio dia por
    // dia con las nuevas fechas (igual que en /obtener-precio). Obligatorios si la orden es de origen "a_medida" y la
    // nueva fecha fin no es null
    @ApiProperty({ description: 'Hora de inicio del primer dia. Obligatorio y unicamente aplica cuando la orden es de origen "a_medida" y la nueva fecha fin no es null', example: '06:00:00', required: false})
    @IsOptional()
    @IsString({ message: 'El campo Hora de inicio debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de inicio no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de inicio no puede exceder los 8 caracteres' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'horaInicio debe tener formato HH:mm:ss'
    })
    horaInicio?: string;

    @ApiProperty({ description: 'Hora de fin del ultimo dia. Obligatorio y unicamente aplica cuando la orden es de origen "a_medida" y la nueva fecha fin no es null', example: '18:00:00', required: false})
    @IsOptional()
    @IsString({ message: 'El campo Hora de fin debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de fin no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de fin no puede exceder los 8 caracteres' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'horaFin debe tener formato HH:mm:ss'
    })
    horaFin?: string;

}
