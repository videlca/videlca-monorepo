import { IsEmail, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsPositive, IsString, Matches, MaxLength, Min, MinLength } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {

    @ApiProperty({ description: 'Primer nombre del usuario', example: 'Pepito', required:true })
    @IsString({ message: 'El campo primer nombre debe ser un string'})
    @IsNotEmpty({ message: 'El campo primer nombre no puede estar vacío' })
    @MaxLength(50, { message: 'El campo primer nombre no puede exceder los 50 caracteres' })
    primerNombre: string;
    
    @ApiProperty({ description: 'Primer nombre del usuario', example: 'Pedro', required:true })
    @IsString({ message: 'El campo segundo nombre debe ser un string'})
    @MaxLength(50, { message: 'El campo segundo nombre no puede exceder los 50 caracteres' })
    @IsOptional()
    segundoNombre?: string;
    
    @ApiProperty({ description: 'Primer apellido del usuario', example: 'Perez', required:true })
    @IsString({ message: 'El campo primer apellido debe ser un string'})
    @IsNotEmpty({ message: 'El campo primer apellido no puede estar vacío' })
    @MaxLength(50, { message: 'El campo primer apellido no puede exceder los 50 caracteres' })
    primerApellido: string

    @ApiProperty({ description: 'Segundo apellido del usuario', example: 'Garcia', required:true })
    @IsString({ message: 'El campo segundo nombre debe ser un string'})
    @MaxLength(50, { message: 'El campo segundo nombre no puede exceder los 50 caracteres' })
    @IsOptional()
    segundoApellido?: string;

    @ApiProperty({ description: 'Email del usuario', example: 'usuario@example.com', required:true})
    @IsEmail({}, {message: "Debe ser un email válido"})
    @IsNotEmpty()
    @MaxLength(100, { message: 'El campo email no puede exceder los 100 caracteres' })
    email: string;

    @ApiProperty({ description: 'Contraseña del usuario', example: 'qjqnejkfhbvqerubvqj123@', required:false})
    @IsOptional()
    @IsString({ message: 'El campo clave debe ser un string' })
    @MinLength(6, { message: 'La clave debe tener al menos 6 caracteres' })
    @MaxLength(50, { message: 'La clave no puede exceder los 50 caracteres' })
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'La clave debe tener una letra mayúscula, una minúscula y un número'
    })
    clave?: string;

    @ApiProperty({ description: 'Número de identifiación del usuario', example: '3014445566', required:true})
    @IsString({ message: 'El campo numero de identificacion debe ser un string'})
    @IsNotEmpty({ message: 'El campo numero de identificacion no puede estar vacío' })
    @MaxLength(50, { message: 'El campo numero de identificacion no puede exceder los 50 caracteres' })
    @IsNumberString({}, { message: 'Solo números permitidos' })
    numeroIdentificacion: string;
    
    @ApiProperty({ description: 'Tipo de identificación del usuario', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo Tipo de de identificacion debe ser un número'})
    @IsPositive({message: 'El valor del campo Tipo de identificacion debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo Tipo de identificacion debe ser minimo 1'})
    idTipoIdentificacion: number;
    
    @ApiProperty({ description: 'Rol del usuario', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo Id Rol debe ser un número'})
    @IsPositive({message: 'El valor del campo Id Rol debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo Id Rol debe ser minimo 1'})
    idRol: number;
    
}
