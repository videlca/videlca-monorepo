import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateTipoContratoDto {

    @ApiProperty({ description: 'Descripción del tipo', example: 'Esta es la descripción del tipo.', required:true})
    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío'})
    @MaxLength(100, { message: 'La descripcion no puede exceder los 100 caracteres' })
    descripcion: string;

    @ApiProperty({ description: 'Identificador de contrato indefinido', example: true, required:true})
    @IsBoolean({message: 'El campo indefinido debe ser boolean'})
    indefinido: boolean;

}