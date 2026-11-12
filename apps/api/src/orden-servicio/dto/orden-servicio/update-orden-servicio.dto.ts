import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsDate, IsString, IsNotEmpty, MaxLength, Matches, IsArray, ValidateNested, IsNumber, IsPositive, Min, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// SOLO SE USA CUANDO LA ORDEN ES DE ORIGEN "catalogo" Y LA NUEVA FECHA FIN NO ES NULL: EL HORARIO DE CADA SERVICIO
// YA EXISTENTE EN LA ORDEN (NO SE PUEDEN AGREGAR/QUITAR SERVICIOS, SOLO REENVIAR SU HORARIO PARA RECALCULAR EL PRECIO
// CON LAS NUEVAS FECHAS)
export class UpdateOrdenServicioDetalleDto {

    // Fila del desglose de la orden a la que corresponde este servicio. Si no se envia se empareja por posicion
    // dentro de cada idTarifa. Necesario para distinguir varias unidades del mismo servicio con distintos dias
    @ApiProperty({ description: 'Id de la fila del desglose de la orden (idOrdenServicioDetalle) a la que corresponde este servicio', example: 10, required: false})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo idOrdenServicioDetalle debe ser un número'})
    @IsPositive({message: 'El valor del campo idOrdenServicioDetalle debe ser un numero positivo'})
    idOrdenServicioDetalle?: number;

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

    // DIAS DE LA SEMANA EN QUE SE PRESTA ESTE SERVICIO (solo catalogo). Opcionales: si no se envian se conservan los
    // que ya tiene el servicio en la orden. El cambio solo afecta los meses que aun no se han liquidado
    @ApiProperty({ description: 'Se presta el lunes', example: true, required: false})
    @IsOptional()
    @IsBoolean({message: 'El campo lunes debe ser boolean'})
    lunes?: boolean;

    @ApiProperty({ description: 'Se presta el martes', example: true, required: false})
    @IsOptional()
    @IsBoolean({message: 'El campo martes debe ser boolean'})
    martes?: boolean;

    @ApiProperty({ description: 'Se presta el miercoles', example: true, required: false})
    @IsOptional()
    @IsBoolean({message: 'El campo miercoles debe ser boolean'})
    miercoles?: boolean;

    @ApiProperty({ description: 'Se presta el jueves', example: true, required: false})
    @IsOptional()
    @IsBoolean({message: 'El campo jueves debe ser boolean'})
    jueves?: boolean;

    @ApiProperty({ description: 'Se presta el viernes', example: true, required: false})
    @IsOptional()
    @IsBoolean({message: 'El campo viernes debe ser boolean'})
    viernes?: boolean;

    @ApiProperty({ description: 'Se presta el sabado', example: true, required: false})
    @IsOptional()
    @IsBoolean({message: 'El campo sabado debe ser boolean'})
    sabado?: boolean;

    @ApiProperty({ description: 'Se presta el domingo', example: true, required: false})
    @IsOptional()
    @IsBoolean({message: 'El campo domingo debe ser boolean'})
    domingo?: boolean;

    @ApiProperty({ description: 'Ademas de los dias marcados, cuenta cualquier dia festivo', example: true, required: false})
    @IsOptional()
    @IsBoolean({message: 'El campo incluyeFestivos debe ser boolean'})
    incluyeFestivos?: boolean;

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
