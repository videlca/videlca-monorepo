import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, IsNumber, IsPositive, Min, IsNotEmpty, MaxLength, IsOptional, IsBoolean, IsEnum, ValidateIf } from 'class-validator';
import { OrigenServicioEnum } from "../../interfaces/origen-servicio.interface";

export class ValidarHorarioServicioDto {

    @ApiProperty({ description: 'Origen del servicio (catalogo o a la medida)', example: OrigenServicioEnum.CATALOGO, required:true})
    @IsEnum(OrigenServicioEnum, { message: 'El campo origen del servicio debe ser un valor válido' })
    @IsNotEmpty({ message: 'El campo origen del servicio no puede estar vacío'})
    origenServicio: OrigenServicioEnum;

    @ApiProperty({ description: 'Id de tarifa. Obligatorio y unicamente aplica cuando origenServicio es "catalogo"', example: 1, required:false})
    @ValidateIf(dto => dto.origenServicio === OrigenServicioEnum.CATALOGO)
    @IsNumber({}, {message: 'El valor del campo tarifa debe ser un número'})
    @IsPositive({message: 'El valor del campo tarifa debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo tarifa debe ser minimo 1'})
    idTarifa?: number;

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

    // DIAS DE LA SEMANA EN QUE SE PRESTA ESTE SERVICIO. Si no se envian, quedan en true por defecto (equivale a "todos los dias")
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

    @ApiProperty({ description: 'Ademas de los dias de semana marcados, cuenta tambien cualquier dia festivo sin importar en que dia de la semana caiga', example: true, required: false})
    @IsOptional()
    @IsBoolean({message: 'El campo incluye festivos debe ser boolean'})
    incluyeFestivos?: boolean;

}
