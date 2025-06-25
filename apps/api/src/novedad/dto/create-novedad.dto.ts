import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from "class-validator";

export class CreateNovedadDto {

    @ApiProperty({ description: 'Descripción de la novedad', example: 'Esta es la descripción de la novedad', required:false})
    @IsString({ message: 'El campo descripcion debe ser un string'})
    @MaxLength(500, { message: 'El campo descripcion no puede exceder los 50 caracteres' })
    @IsOptional()
    descripcion?: string;

    @ApiProperty({ description: 'Fecha de inicio de la novedad', example: '1/1/2025', required:true})
    @IsDateString({}, { message: 'fechaInicio debe ser una fecha válida' })
    fechaInicio: string;

    @ApiProperty({ description: 'Hora de inicio de la novedad', example: '15:45', required:true})
    @IsString({ message: 'El campo Hora Inicio debe ser un string'})
    horaInicio: string;

    @ApiProperty({ description: 'Fecha de finalización de la novedad', example: '2/1/2025', required:false})
    @IsDateString({}, { message: 'fechaFin debe ser una fecha válida' })
    @IsOptional()
    fechaFin?: string;

    @ApiProperty({ description: 'Hora de finalización de la novedad', example: '15:45', required:false})
    @IsString({ message: 'El campo Hora Fin debe ser un string'})
    @IsOptional()
    horaFin?: string;

    @ApiProperty({ description: 'Id del tipo de la novedad', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo Tipo de Novedad debe ser un número'})
    @IsPositive({message: 'El valor del campo Tipo Novedad debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo Tipo Novedad debe ser minimo 1'})
    idTipoNovedad: number;
  
}
