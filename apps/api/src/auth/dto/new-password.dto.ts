import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class NewPasswordDto {
    
    @IsString({ message: 'El campo clave debe ser un string' })
    @MinLength(6, { message: 'La clave debe tener al menos 6 caracteres' })
    @MaxLength(50, { message: 'La clave no puede exceder los 50 caracteres' })
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'La clave debe tener una letra mayúscula, una minúscula y un número'
    })
    clave: string;
    
    @IsString({ message: 'El campo confirmar clave debe ser un string' })
    @MinLength(6, { message: 'La clave debe tener al menos 6 caracteres' })
    @MaxLength(50, { message: 'La clave no puede exceder los 50 caracteres' })
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'La clave debe tener una letra mayúscula, una minúscula y un número'
    })
    confirmarClave: string;

}