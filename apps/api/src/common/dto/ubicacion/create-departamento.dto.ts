import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsNotEmpty, IsPositive, IsString, Min, MaxLength, MinLength, Matches } from "class-validator";

export class CreateDepartamentoDto {
    
    @ApiProperty({ description: 'Descripción del departamento', example: 'Esta es la descripción del departamento', required:true})
    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío'})
    descripcion: string;
    
    @ApiProperty({ description: 'Identificador del Id del país', example: 2, required:true})
    @IsNumber({}, {message: 'El valor del campo pais no puede estar vacio'})
    @IsPositive({message: 'El valor del campo pais no puede estar vacio'})
    @Min(1, {message: 'El valor del campo pais no puede estar vacio'})
    pais: number;
    
    @ApiProperty({ description: 'Código del departamento', example: '05', required:true})
    @IsString({message: 'El campo codigo departamento debe ser un string'})
    @Matches(/^[0-9]+$/, {
        message: 'El código departamento debe contener solo números',
    })
    @IsNotEmpty({ message: 'El campo codigo departamento no puede estar vacío'})
    @MaxLength(2, {message: 'El campo codigo departamento solo puede tener 2 caracteres'})
    @MinLength(2, {message: 'El campo codigo departamento solo puede tener 2 caracteres'})
    codigoDepartamento: string;

}