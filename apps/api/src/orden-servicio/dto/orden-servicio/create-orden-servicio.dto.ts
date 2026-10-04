import { ApiProperty } from "@nestjs/swagger";
import {
    IsString,
    IsOptional,
    IsEnum,
    IsBoolean,
    Matches,
    IsNumber,
    IsPositive,
    Min,
    Max,
    IsInt,
    IsNotEmpty,
    MaxLength,
    IsDate,
    IsArray,
    ArrayMinSize,
    ValidateNested
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { OrigenServicioEnum } from "../../interfaces/origen-servicio.interface";

// EL DESGLOSE (idTarifa, horaInicio, horaFin, cantidadHoras y el precio) DE CADA FILA SE OBTIENE PREVIAMENTE
// DESDE /obtener-precio Y SE ENVIA AQUI TAL CUAL SE RECIBIO, PARA NO VOLVER A CALCULAR EL PRECIO AL CREAR LA ORDEN
export class CreateOrdenServicioDetalleDto {

    @ApiProperty({ description: 'Id de la tarifa del catalogo a la que pertenece esta fila del desglose', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo tarifa debe ser un número'})
    @IsPositive({message: 'El valor del campo tarifa debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo tarifa debe ser minimo 1'})
    idTarifa: number;

    // ACEPTA TAMBIEN EL LITERAL '24:00:00': para ordenes "a_medida", calcularPrecioAMedida devuelve ese valor
    // (via minutosAHora) como horaFin/horaInicio de los dias intermedios/limite de un rango (fin de dia = minuto
    // 1440), y este desglose se reenvia aqui tal cual se recibio de /obtener-precio (ver comentario de la clase)
    @ApiProperty({ description: 'Hora de inicio de esta fila del desglose', example: '06:00:00', required:true})
    @IsString({ message: 'El campo Hora de inicio debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de inicio no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de inicio no puede exceder los 8 caracteres' })
    @Matches(/^(([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]|24:00:00)$/, {
        message: 'horaInicio debe tener formato HH:mm:ss'
    })
    horaInicio: string;

    @ApiProperty({ description: 'Hora de finalizacion de esta fila del desglose', example: '18:00:00', required:true})
    @IsString({ message: 'El campo Hora de fin debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de fin no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de fin no puede exceder los 8 caracteres' })
    @Matches(/^(([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]|24:00:00)$/, {
        message: 'horaFin debe tener formato HH:mm:ss'
    })
    horaFin: string;

    // DIAS DE LA SEMANA EN QUE SE PRESTA ESTE SERVICIO. Solo aplica para ordenes de origen "catalogo" (en "a_medida"
    // no se seleccionan dias de la semana sueltos, es un rango continuo de fechas/horas). Si no se envian, quedan
    // en true por defecto (equivale a "todos los dias")
    @ApiProperty({ description: 'Se presta el lunes. Solo aplica para ordenes de origen "catalogo"', example: true, required: false})
    @IsOptional()
    @IsBoolean({message: 'El campo lunes debe ser boolean'})
    lunes?: boolean;

    @ApiProperty({ description: 'Se presta el martes. Solo aplica para ordenes de origen "catalogo"', example: true, required: false})
    @IsOptional()
    @IsBoolean({message: 'El campo martes debe ser boolean'})
    martes?: boolean;

    @ApiProperty({ description: 'Se presta el miercoles. Solo aplica para ordenes de origen "catalogo"', example: true, required: false})
    @IsOptional()
    @IsBoolean({message: 'El campo miercoles debe ser boolean'})
    miercoles?: boolean;

    @ApiProperty({ description: 'Se presta el jueves. Solo aplica para ordenes de origen "catalogo"', example: true, required: false})
    @IsOptional()
    @IsBoolean({message: 'El campo jueves debe ser boolean'})
    jueves?: boolean;

    @ApiProperty({ description: 'Se presta el viernes. Solo aplica para ordenes de origen "catalogo"', example: true, required: false})
    @IsOptional()
    @IsBoolean({message: 'El campo viernes debe ser boolean'})
    viernes?: boolean;

    @ApiProperty({ description: 'Se presta el sabado. Solo aplica para ordenes de origen "catalogo"', example: true, required: false})
    @IsOptional()
    @IsBoolean({message: 'El campo sabado debe ser boolean'})
    sabado?: boolean;

    @ApiProperty({ description: 'Se presta el domingo. Solo aplica para ordenes de origen "catalogo"', example: true, required: false})
    @IsOptional()
    @IsBoolean({message: 'El campo domingo debe ser boolean'})
    domingo?: boolean;

    @ApiProperty({ description: 'Ademas de los dias de semana marcados, cuenta tambien cualquier dia festivo sin importar en que dia de la semana caiga. Solo aplica para ordenes de origen "catalogo"', example: true, required: false})
    @IsOptional()
    @IsBoolean({message: 'El campo incluye festivos debe ser boolean'})
    incluyeFestivos?: boolean;

    @ApiProperty({ description: 'Cantidad de horas de esta fila. Solo aplica para ordenes de origen "a_medida"', example: 4, required: false})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo cantidad de horas debe ser un número'})
    @IsPositive({message: 'El valor del campo cantidad de horas debe ser un numero positivo'})
    cantidadHoras?: number;

    @ApiProperty({ description: 'Dia calendario al que pertenece esta fila. Solo aplica para ordenes de origen "a_medida" (cada fila es un dia)', example: 'ISO String 2024-03-15T00:00:00.000Z', required: false})
    @IsOptional()
    @Transform(({ value }) => value ? new Date(value) : null)
    @IsDate()
    fecha?: Date | null;

    @ApiProperty({ description: 'Costos directos de esta fila del desglose. Solo se envia si la orden tiene fecha de fin (es definida)', example: 100000, required: false})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo costos directos debe ser un número'})
    costosDirectos?: number;

    @ApiProperty({ description: 'Seguro de vida de esta fila del desglose', example: 373, required: false})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo seguro de vida debe ser un número'})
    seguroVida?: number;

    @ApiProperty({ description: 'Costos directos + seguro de vida de esta fila del desglose', example: 100373, required: false})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo costos directos + seguro de vida debe ser un número'})
    costosDirectosSeguroVida?: number;

    @ApiProperty({ description: 'AUI de esta fila del desglose', example: 10038, required: false})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo aui debe ser un número'})
    aui?: number;

    @ApiProperty({ description: 'Precio antes de iva de esta fila del desglose', example: 110411, required: false})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo precio antes de iva debe ser un número'})
    precioAntesIva?: number;

    @ApiProperty({ description: 'Iva de esta fila del desglose', example: 2098, required: false})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo iva debe ser un número'})
    iva?: number;

    @ApiProperty({ description: 'Precio total (con iva) de esta fila del desglose', example: 112509, required: false})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo precio debe ser un número'})
    precio?: number;

}

export class CreateOrdenServicioDto {

    @ApiProperty({ description: 'Origen de la orden de servicio', example: OrigenServicioEnum.CATALOGO, required:true})
    @IsEnum(OrigenServicioEnum, { message: 'El campo origen de la orden de servicio debe ser un valor válido' })
    @IsNotEmpty({ message: 'El campo origen de la orden de servicio no puede estar vacío'})
    origenServicio: OrigenServicioEnum;

    @ApiProperty({ description: 'Numero de orden de la orden de servicio', example: 'A-23456', required:true})
    @IsString({ message: 'El campo numero orden de servicio debe ser un string'})
    @IsNotEmpty({ message: 'El campo numero orden de servicio no puede estar vacío'})
    @MaxLength(100, { message: 'El campo numero orden de servicio no puede exceder los 100 caracteres' })
    numeroOrdenServicio: string;

    // "Monitoreo de alarmas" SIEMPRE va con idCliente (nunca tiene locacion). "Vigilancia y escolta" acepta idLocacion
    // O idCliente (nunca ambos): si se sabe el puesto se envia idLocacion, si se le va a asignar directo al cliente
    // (sin puesto especifico) se envia idCliente
    @ApiProperty({ description: 'Id de locacion. Solo aplica si el tipo de servicio de la orden es "Vigilancia y escolta" (ahi es opcional entre esto o idCliente)', example: 1, required: false})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo locacion debe ser un número'})
    @IsPositive({message: 'El valor del campo locacion debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo locacion debe ser minimo 1'})
    idLocacion?: number;

    // Requerido siempre si el tipo de servicio es "Monitoreo de alarmas". Opcional (alternativa a idLocacion) si es "Vigilancia y escolta"
    @ApiProperty({ description: 'Id de cliente. Requerido si el tipo de servicio de la orden es "Monitoreo de alarmas"; opcional (alternativa a idLocacion) si es "Vigilancia y escolta"', example: 1, required: false})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo cliente debe ser un número'})
    @IsPositive({message: 'El valor del campo cliente debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo cliente debe ser minimo 1'})
    idCliente?: number;

    @ApiProperty({ description: 'Fecha de inicio de la orden de servicio', example: 'ISO String 2024-03-15T00:00:00.000Z', required: true})
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaInicio: Date;

    @ApiProperty({ description: 'Fecha de fin de la orden de servicio', example: 'ISO String 2024-03-15T00:00:00.000Z', required: false})
    @IsOptional()
    @Transform(({ value }) => value ? new Date(value) : null)
    @IsDate()
    fechaFin?: Date | null;

    // COBRO PARCIAL MENSUAL (opcional): rango de dias de cada mes que se cobra al liquidar la orden. Solo para ordenes
    // indefinidas (sin fechaFin) de origen "catalogo"; se envian los dos o ninguno, y diaInicioCobro <= diaFinCobro
    // (el rango nunca cruza de un mes a otro). Validado en el servicio
    @ApiProperty({ description: 'Dia del mes desde el que se cobra cada mes (1-31). Opcional, junto con diaFinCobro. Solo ordenes indefinidas de origen "catalogo"', example: 1, required: false})
    @IsOptional()
    @IsInt({ message: 'El campo dia inicio de cobro debe ser un número entero' })
    @Min(1, { message: 'El campo dia inicio de cobro debe ser minimo 1' })
    @Max(31, { message: 'El campo dia inicio de cobro debe ser maximo 31' })
    diaInicioCobro?: number | null;

    @ApiProperty({ description: 'Dia del mes hasta el que se cobra cada mes (1-31). Opcional, junto con diaInicioCobro. Debe ser mayor o igual a diaInicioCobro', example: 15, required: false})
    @IsOptional()
    @IsInt({ message: 'El campo dia fin de cobro debe ser un número entero' })
    @Min(1, { message: 'El campo dia fin de cobro debe ser minimo 1' })
    @Max(31, { message: 'El campo dia fin de cobro debe ser maximo 31' })
    diaFinCobro?: number | null;

    @ApiProperty({ description: 'Fecha de creacion de la orden de servicio, se toma desde el front para tomar fecha del sistema', example: 'ISO String 2024-03-15T00:00:00.000Z', required: true})
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaCreacion: Date;

    // Array del desglose de servicios de la orden (mínimo 1), obtenido previamente desde /obtener-precio
    @ApiProperty({
        description: 'Desglose de servicios de la orden, tal como se obtuvo desde /obtener-precio',
        type: [CreateOrdenServicioDetalleDto],
        required: true,
        example: [
            {
                idTarifa: 1,
                horaInicio: '06:00:00',
                horaFin: '18:00:00',
            }
        ]
    })
    @IsArray()
    @ArrayMinSize(1, { message: 'La orden de servicio debe tener al menos un servicio' })
    @ValidateNested({ each: true })
    @Type(() => CreateOrdenServicioDetalleDto)
    servicios: CreateOrdenServicioDetalleDto[];

}
