import { IsNumber, IsNotEmpty, IsPositive, IsString, Min } from "class-validator";

export class CreateDepartamentoDto {
    
    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío'})
    descripcion: string;
    
    @IsNumber({}, {message: 'El valor del campo pais debe ser un número'})
    @IsPositive({message: 'El valor del campo pais debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo pais debe ser minimo 1'})
    pais: number;
    
    @IsString({message: 'El campo codigo departamento debe ser un string'})
    @IsNotEmpty({ message: 'El campo codigo departamento no puede estar vacío'})
    codigoDepartamento: string;

}