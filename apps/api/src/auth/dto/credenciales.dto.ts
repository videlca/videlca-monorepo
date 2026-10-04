import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CredencialesDto {
    
    @ApiProperty({ description: 'Contraseña del usuario', example: 'dfjnveliuvneiv123@', required:true})
    @IsString({ message: 'El campo clave debe ser un string' })
    @MinLength(6, { message: 'La clave debe tener al menos 6 caracteres' })
    @MaxLength(50, { message: 'La clave no puede exceder los 50 caracteres' })
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'La clave debe tener una letra mayúscula, una minúscula y un número'
    })
    clave: string;
    
    @ApiProperty({ description: 'Confirmar contraseña del usuario', example: 'dfjnveliuvneiv123@', required:true})
    @IsString({ message: 'El campo confirmar clave debe ser un string' })
    @MinLength(6, { message: 'La clave debe tener al menos 6 caracteres' })
    @MaxLength(50, { message: 'La clave no puede exceder los 50 caracteres' })
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'La clave debe tener una letra mayúscula, una minúscula y un número'
    })
    confirmarClave: string;
    
    @ApiProperty({ description: 'token de seguridad de videlca', example: 'dfjnveliuvneiv123@', required:true})
    @IsString({ message: 'El campo token videlca debe ser un string' })
    @IsNotEmpty()
    tokenVidelca: string;

}