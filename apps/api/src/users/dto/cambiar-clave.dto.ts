import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";

// CAMBIO DE CONTRASEÑA DESDE EL PERFIL: se confirma la actual y se escribe la nueva dos veces
export class CambiarClaveDto {

    @ApiProperty({ description: 'Contraseña actual del usuario', required: true })
    @IsString({ message: 'La contraseña actual debe ser un string' })
    @IsNotEmpty({ message: 'Debe ingresar la contraseña actual' })
    claveActual: string;

    @ApiProperty({ description: 'Nueva contraseña', example: 'NuevaClave123', required: true })
    @IsString({ message: 'La nueva contraseña debe ser un string' })
    @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
    @MaxLength(50, { message: 'La nueva contraseña no puede exceder los 50 caracteres' })
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'La nueva contraseña debe tener una letra mayúscula, una minúscula y un número'
    })
    claveNueva: string;

    @ApiProperty({ description: 'Confirmacion de la nueva contraseña', example: 'NuevaClave123', required: true })
    @IsString({ message: 'La confirmacion debe ser un string' })
    @IsNotEmpty({ message: 'Debe confirmar la nueva contraseña' })
    confirmarClaveNueva: string;

}
