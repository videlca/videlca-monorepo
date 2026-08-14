import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsString, Matches, IsNumber, IsPositive, Min, IsNotEmpty, MaxLength, IsOptional, IsDate, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';

export class PrecioOrdenServicioItemDto {

    @ApiProperty({ description: 'Id de tarifa. Opcional: los servicios de horario mixto con tarifa por hora no tienen una tarifa guardada, en ese caso enviar idServicio', example: 1, required:false})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo tarifa debe ser un número'})
    @IsPositive({message: 'El valor del campo tarifa debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo tarifa debe ser minimo 1'})
    idTarifa?: number;

    @ApiProperty({ description: 'Id de servicio', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo servicio debe ser un número'})
    @IsPositive({message: 'El valor del campo servicio debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo servicio debe ser minimo 1'})
    idServicio: number;

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

    @ApiProperty({ description: 'Fecha de inicio de la orden de servicio', example: 'ISO String 2024-03-15T00:00:00.000Z', required: true})
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaInicio: Date;

    @ApiProperty({ description: 'Fecha de fin de la orden de servicio', example: 'ISO String 2024-03-15T00:00:00.000Z', required: false})
    @IsOptional()
    @Transform(({ value }) => value ? new Date(value) : null)
    @IsDate()
    fechaFin?: Date | null;

    @ApiProperty({
        description: 'Lista de servicios de la orden a los que se les va a calcular el precio',
        type: [PrecioOrdenServicioItemDto],
        required: true
    })
    @IsArray({message: 'Los servicios deben ser un arreglo'})
    @ArrayMinSize(1, {message: 'Debe enviar al menos un servicio'})
    @ValidateNested({ each: true })
    @Type(() => PrecioOrdenServicioItemDto)
    servicios: PrecioOrdenServicioItemDto[];

}
