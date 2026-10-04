import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateTipoUnidadTiempoDto {

    @ApiProperty({ description: 'Descripción del tipo de unidad de tiempo', example: 'Esta es la descripción del tipo de unidad de tiempo', required:true})
    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío'})
    @MaxLength(100, { message: 'La descripcion no puede exceder los 100 caracteres' })
    descripcion: string;

    @ApiProperty({ description: 'Identificador de estado activo', example: true, required: true})
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    requiereTiempo: boolean;

}