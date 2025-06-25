import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsNotEmpty, IsPositive, IsString, Min } from "class-validator";

export class CreateDepartamentoDto {
    
    @ApiProperty({ description: 'Descripción del departamento', example: 'Esta es la descripción del departamento', required:true})
    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío'})
    descripcion: string;
    
    @ApiProperty({ description: 'Identificador del Id del país', example: 2, required:true})
    @IsNumber({}, {message: 'El valor del campo pais debe ser un número'})
    @IsPositive({message: 'El valor del campo pais debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo pais debe ser minimo 1'})
    pais: number;
    
    @ApiProperty({ description: 'Código del departamento', example: 'A321', required:true})
    @IsString({message: 'El campo codigo departamento debe ser un string'})
    @IsNotEmpty({ message: 'El campo codigo departamento no puede estar vacío'})
    codigoDepartamento: string;

}