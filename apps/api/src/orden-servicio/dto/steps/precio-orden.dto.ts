import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
    IsString,
    Matches,
    IsNumber,
    IsPositive,
    Min,
    IsNotEmpty,
    MaxLength,
    IsOptional,
    IsDate,
    IsArray,
    ArrayMinSize,
    ValidateNested,
    IsEnum,
    ValidateIf
} from 'class-validator';
import { OrigenServicioEnum } from "../../interfaces/origen-servicio.interface";

// CATALOGO: cada servicio ya tiene una tarifa (idTarifa) elegida del catalogo para el periodo
export class PrecioOrdenServicioItemDto {

    @ApiProperty({ description: 'Id de tarifa', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo tarifa debe ser un número'})
    @IsPositive({message: 'El valor del campo tarifa debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo tarifa debe ser minimo 1'})
    idTarifa: number;

    @ApiProperty({ description: 'Hora de inicio por dia del servicio', example: '06:00:00', required:true})
    @IsString({ message: 'El campo Hora de inicio debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de inicio no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de inicio no puede exceder los 8 caracteres' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'horaInicio debe tener formato HH:mm:ss'
    })
    horaInicio: string;

    @ApiProperty({ description: 'Hora de finalizacion por dia del servicio', example: '18:00:00', required:true})
    @IsString({ message: 'El campo Hora de fin debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de fin no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de fin no puede exceder los 8 caracteres' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'horaFin debe tener formato HH:mm:ss'
    })
    horaFin: string;

}

export class PrecioOrdenDto {

    @ApiProperty({ description: 'Origen de los servicios de la orden (catalogo o a la medida)', example: OrigenServicioEnum.CATALOGO, required:true})
    @IsEnum(OrigenServicioEnum, { message: 'El campo origen de la orden de servicio debe ser un valor válido' })
    @IsNotEmpty({ message: 'El campo origen de la orden de servicio no puede estar vacío'})
    origenServicio: OrigenServicioEnum;

    @ApiProperty({ description: 'Fecha de inicio de la orden de servicio', example: 'ISO String 2024-03-15T00:00:00.000Z', required: true})
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaInicio: Date;

    @ApiProperty({ description: 'Fecha de fin de la orden de servicio', example: 'ISO String 2024-03-15T00:00:00.000Z', required: false})
    @IsOptional()
    @Transform(({ value }) => value ? new Date(value) : null)
    @IsDate()
    fechaFin?: Date | null;

    // CATALOGO: uno o mas servicios, cada uno con su propia tarifa ya elegida del catalogo del periodo
    @ApiProperty({
        description: 'Lista de servicios del catalogo a los que se les va a calcular el precio. Obligatorio y unicamente aplica cuando origenServicio es "catalogo"',
        type: [PrecioOrdenServicioItemDto],
        required: false
    })
    @ValidateIf(dto => dto.origenServicio === OrigenServicioEnum.CATALOGO)
    @IsArray({message: 'Los servicios deben ser un arreglo'})
    @ArrayMinSize(1, {message: 'Debe enviar al menos un servicio'})
    @ValidateNested({ each: true })
    @Type(() => PrecioOrdenServicioItemDto)
    servicios?: PrecioOrdenServicioItemDto[];

    // A LA MEDIDA: un unico rango horario continuo (el mismo horario aplica el primer y ultimo dia del rango)
    @ApiProperty({ description: 'Hora de inicio del servicio el primer dia. Obligatorio y unicamente aplica cuando origenServicio es "a_medida"', example: '06:00:00', required: false})
    @ValidateIf(dto => dto.origenServicio === OrigenServicioEnum.A_MEDIDA)
    @IsString({ message: 'El campo Hora de inicio debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de inicio no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de inicio no puede exceder los 8 caracteres' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'horaInicio debe tener formato HH:mm:ss'
    })
    horaInicio?: string;

    @ApiProperty({ description: 'Hora de fin del servicio el ultimo dia. Obligatorio y unicamente aplica cuando origenServicio es "a_medida"', example: '18:00:00', required: false})
    @ValidateIf(dto => dto.origenServicio === OrigenServicioEnum.A_MEDIDA)
    @IsString({ message: 'El campo Hora de fin debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de fin no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de fin no puede exceder los 8 caracteres' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'horaFin debe tener formato HH:mm:ss'
    })
    horaFin?: string;

}
