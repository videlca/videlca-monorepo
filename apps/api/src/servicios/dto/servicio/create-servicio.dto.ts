import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Max, MaxLength, Min } from "class-validator";

export class CreateServicioDto {

    @ApiProperty({ description: 'codigo del servicio', example: '020', required:true})
    @IsString({ message: 'El campo codigo debe ser un string'})
    @IsNotEmpty({ message: 'El campo codigo no puede estar vacío' })
    @MaxLength(10, { message: 'El campo codigo no puede exceder los 10 caracteres' })
    codigo: string;
   
    @ApiProperty({ description: 'descripcion del servicio', example: 'Vigilancia 12 horas', required:true})
    @IsString({ message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío' })
    @MaxLength(100, { message: 'El campo descripcion no puede exceder los 100 caracteres' })
    descripcion: string;

    @ApiProperty({ description: 'Id el tipo de servicio', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo tipo servicio debe ser un número'})
    @IsPositive({message: 'El valor del campo tipo servicio debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo tipo servicio debe ser minimo 1'})
    idTipoServicio: number;
    
    @ApiProperty({ description: 'Id del tipo de duracion de un servicio', example: 2, required:true})
    @IsNumber({}, {message: 'El valor del campo tipo duracion debe ser un número'})
    @IsPositive({message: 'El valor del campo tipo duracion debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo tipo duracion debe ser minimo 1'})
    idTipoDuracion: number;
    
    @ApiProperty({ description: 'id del tipo de horario descripcion de un servicio', example: 2, required:true})
    @IsNumber({}, {message: 'El valor del campo tipo horario descripcion debe ser un número'})
    @IsPositive({message: 'El valor del campo tipo horario descripcion debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo tipo horario descripcion debe ser minimo 1'})
    idTipoHorarioDescripcion: number;
    
    @ApiProperty({ description: 'Horas fijas que debe cumplir un servicio si el tipo de duracion es fijo', example: 2, required: false})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo horas fijas debe ser un número'})
    @IsPositive({message: 'El valor del campo horas fijas debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo horas fijas debe ser minimo 1'})
    @Max(24, {message: 'El valor del campo horas fijas debe ser maximo 24'})
    horasFijas?: number;
    
    @ApiProperty({ description: 'Horas minimas que debe cumplir un servicio si el tipo de duracion es flexible', example: 2, required: false})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo horas minimas debe ser un número'})
    @IsPositive({message: 'El valor del campo horas minimas debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo horas minimas debe ser minimo 1'})
    @Max(24, {message: 'El valor del campo horas minimas debe ser maximo 24'})
    horasMinimas?: number;
    
    @ApiProperty({ description: 'Horas maximas que debe cumplir un servicio si el tipo de duracion es flexible', example: 2, required: false})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo horas maximas debe ser un número'})
    @IsPositive({message: 'El valor del campo horas maximas debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo horas maximas debe ser minimo 1'})
    @Max(24, {message: 'El valor del campo horas maximas debe ser maximo 24'})
    horasMaximas?: number;
    
}
