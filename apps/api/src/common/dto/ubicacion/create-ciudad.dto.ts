import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive, IsString, IsBoolean, IsOptional, Min, MaxLength } from "class-validator";

export class CreateCiudadDto {
    
    @ApiProperty({ description: 'descripción de la ciudad', example: 'Descripción de la ciudad', required:true})
    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío'})
    descripcion: string;
    
    @ApiProperty({ description: 'Departamento al que pertenece la ciudad', example: 2, required:true})
    @IsNumber({}, {message: 'El valor del campo departamento debe ser un número'})
    @IsPositive({message: 'El valor del campo departamento debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo departamento debe ser minimo 1'})
    departamento: number;

    @ApiProperty({ description: 'Identificador de la ciudad', example: 'A123', required:true})
    @IsString({message: 'El campo codigo ciudad debe ser un string'})
    @IsNotEmpty({ message: 'El campo codigo ciudad no puede estar vacío'})
    codigoCiudad: string;

}