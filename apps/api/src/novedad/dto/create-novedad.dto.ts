import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from "class-validator";

export class CreateNovedadDto {
    
    @IsString({ message: 'El campo descripcion debe ser un string'})
    @MaxLength(500, { message: 'El campo descripcion no puede exceder los 50 caracteres' })
    @IsOptional()
    descripcion?: string;

    @IsDateString({}, { message: 'fechaInicio debe ser una fecha válida' })
    fechaInicio: string;

    @IsString({ message: 'El campo Hora Inicio debe ser un string'})
    horaInicio: string;

    @IsDateString({}, { message: 'fechaFin debe ser una fecha válida' })
    @IsOptional()
    fechaFin?: string;

    @IsString({ message: 'El campo Hora Fin debe ser un string'})
    @IsOptional()
    horaFin?: string;

    @IsNumber({}, {message: 'El valor del campo Tipo de Novedad debe ser un número'})
    @IsPositive({message: 'El valor del campo Tipo Novedad debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo Tipo Novedad debe ser minimo 1'})
    idTipoNovedad: number;
  
}
