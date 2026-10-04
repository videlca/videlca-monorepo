import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumberString, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const CLAVE_SEGURA = /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;

export class LoginUserDto {

    @ApiProperty({ description: 'Email el usuario', example: 'usuario1@example.com', required:true})
    @IsEmail({}, {message: "Debe ser un email válido"})
    @IsNotEmpty({ message: 'El campo email no puede estar vacío' })
    @MaxLength(50, { message: 'El campo email no puede exceder los 50 caracteres' })
    email!: string;

    @ApiProperty({ description: 'Contraseñ del usuario', example: 'jcnqeljncqli123@', required:true})
    @IsString({ message: 'El campo clave debe ser un string'})
    @IsNotEmpty({ message: 'El campo clave no puede estar vacío'})
    clave!: string;

}

export class NewPasswordDto {

    @ApiProperty({ description: 'Contraseña del usuario', example: 'dfjnveliuvneiv123@', required:true})
    @IsString({ message: 'El campo clave debe ser un string' })
    @MinLength(6, { message: 'La clave debe tener al menos 6 caracteres' })
    @MaxLength(50, { message: 'La clave no puede exceder los 50 caracteres' })
    @Matches(CLAVE_SEGURA, {
        message: 'La clave debe tener una letra mayúscula, una minúscula y un número'
    })
    clave!: string;

    @ApiProperty({ description: 'Confirmar contraseña del usuario', example: 'dfjnveliuvneiv123@', required:true})
    @IsString({ message: 'El campo confirmar clave debe ser un string' })
    @MinLength(6, { message: 'La clave debe tener al menos 6 caracteres' })
    @MaxLength(50, { message: 'La clave no puede exceder los 50 caracteres' })
    @Matches(CLAVE_SEGURA, {
        message: 'La clave debe tener una letra mayúscula, una minúscula y un número'
    })
    confirmarClave!: string;

}

export class ReestablecerDatosDto {

    @ApiProperty({ description: 'Número de identificación del usuario:', example: '122233344455', required:true})
    @IsString({ message: 'El campo numero de identificacion debe ser un string'})
    @IsNotEmpty({ message: 'El campo numero identificacion no puede estar vacío' })
    @MaxLength(50, { message: 'El campo numero identificacion no puede exceder los 50 caracteres' })
    @IsNumberString({}, { message: 'Solo números permitidos' })
    numeroIdentificacion!: string;

}
