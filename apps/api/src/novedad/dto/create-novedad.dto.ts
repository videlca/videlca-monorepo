import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDate, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Matches, MaxLength, Min } from "class-validator";

export class CreateNovedadDto {

    @ApiProperty({ description: 'Descripción de la novedad', example: 'Esta es la descripción de la novedad', required:false})
    @IsString({ message: 'El campo descripcion debe ser un string'})
    @MaxLength(500, { message: 'El campo descripcion no puede exceder los 50 caracteres' })
    @IsOptional()
    descripcion?: string;

    @ApiProperty({ description: 'Fecha de inicio de la novedad', example: 'ISO String 2024-03-15T00:00:00.000Z', required:true})
    @Transform(({ value }) => new Date(value))
    @IsDate()
    fechaInicio: Date;

    @ApiProperty({ description: 'Fecha de finalización de la novedad', example: 'ISO String 2024-03-15T00:00:00.000Z', required:false})
    @IsOptional()   
    @Transform(({ value }) => value ? new Date(value) : null)
    @IsDate()
    fechaFin?: Date | null;

    @ApiProperty({ description: 'Hora de inicio de la novedad', example: '06:00:00', required:true})
    @IsString({ message: 'El campo Hora de inicio debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de inicio no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de inicio no puede exceder los 8 caracteres' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'horaInicio debe tener formato HH:mm:ss'
    })
    horaInicio: string;

    @ApiProperty({ description: 'Hora de finalizacion de la novedad', example: '06:00:00', required:false})
    @IsOptional()
    @IsString({ message: 'El campo Hora de fin debe ser un string'})
    @IsNotEmpty({ message: 'El campo Hora de fin no puede estar vacío'})
    @MaxLength(8, { message: 'El campo Hora de fin no puede exceder los 8 caracteres' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'horaFin debe tener formato HH:mm:ss'
    })
    horaFin?: string | null;

    @ApiProperty({ description: 'Id del tipo de la novedad', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo Tipo de Novedad debe ser un número'})
    @IsPositive({message: 'El valor del campo Tipo Novedad debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo Tipo Novedad debe ser minimo 1'})
    idTipoNovedad: number;
  
}
