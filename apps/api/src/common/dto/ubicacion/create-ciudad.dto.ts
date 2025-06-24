import { IsNotEmpty, IsNumber, IsPositive, IsString, IsBoolean, IsOptional, Min, MaxLength } from "class-validator";

export class CreateCiudadDto {
    
    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío'})
    descripcion: string;
    
    @IsNumber({}, {message: 'El valor del campo departamento debe ser un número'})
    @IsPositive({message: 'El valor del campo departamento debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo departamento debe ser minimo 1'})
    departamento: number;

    @IsString({message: 'El campo codigo ciudad debe ser un string'})
    @IsNotEmpty({ message: 'El campo codigo ciudad no puede estar vacío'})
    codigoCiudad: string;

}