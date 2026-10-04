import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Matches, MaxLength, Min, MinLength } from "class-validator";

export class UpdateUserDto {
    
    @ApiProperty({ description: 'Primer nombre del usuario', example: 'Pepito', required:false})
    @IsOptional()
    @IsString({ message: 'El campo primer nombre debe ser un string'})
    @MaxLength(50, { message: 'El campo primer nombre no puede exceder los 50 caracteres' })
    primerNombre?: string;

    @ApiProperty({ description: 'Segundo nombre del usuario', example: 'Pedro', required:false})
    @IsOptional()
    @IsString({ message: 'El campo segundo nombre debe ser un string'})
    @MaxLength(50, { message: 'El campo segundo nombre no puede exceder los 50 caracteres' })
    segundoNombre?: string;
    
    @ApiProperty({ description: 'Primer apellido del usuario', example: 'Perez', required:false})
    @IsOptional()
    @IsString({ message: 'El campo primer apellido debe ser un string'})
    @MaxLength(50, { message: 'El campo primer apellido no puede exceder los 50 caracteres' })
    primerApellido?: string
    
    @ApiProperty({ description: 'Segundo apellido del usuario', example: 'Garcia', required:false})
    @IsOptional()
    @IsString({ message: 'El campo segundo nombre debe ser un string'})
    @MaxLength(50, { message: 'El campo segundo nombre no puede exceder los 50 caracteres' })
    segundoApellido?: string;
    
    @ApiProperty({ description: 'Email del usuario', example: 'usuario@example.com', required:false})
    @IsOptional()
    @IsEmail({}, {message: "Debe ser un email válido"})
    @MaxLength(100, { message: 'El campo email no puede exceder los 100 caracteres' })
    email?: string;

    @ApiProperty({ description: 'Contraseña del usuario', example: 'fbvqoeruvnduijncqjdfnc123@', required:false})
    @IsOptional()
    @IsString({ message: 'El campo clave debe ser un string' })
    @MinLength(6, { message: 'La clave debe tener al menos 6 caracteres' })
    @MaxLength(50, { message: 'La clave no puede exceder los 50 caracteres' })
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'La clave debe tener una letra mayúscula, una minúscula y un número'
    })
    clave?: string;
    
    @ApiProperty({ description: 'Número de identificación del usuario', example: '111222333444', required:false})
    @IsOptional()
    @IsString({ message: 'El campo numero de identificacion debe ser un string'})
    @MaxLength(50, { message: 'El campo numero de identificacion no puede exceder los 50 caracteres' })
    numeroIdentificacion?: string;
    
    @ApiProperty({ description: 'Tipo de identificación del usuario', example: 1, required:false})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo Tipo de de identificacion debe ser un número'})
    @IsPositive({message: 'El valor del campo Tipo de identificacion debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo Tipo de identificacion debe ser minimo 1'})
    idTipoIdentificacion?: number;

}
