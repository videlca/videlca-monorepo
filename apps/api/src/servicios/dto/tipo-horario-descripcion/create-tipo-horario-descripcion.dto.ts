import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateTipoHorarioDescripcionDto {

    @ApiProperty({ description: 'nombre del tipo horario', example: 'Este es el nombre del tipo horario.', required:true})
    @IsString({message: 'El campo nombre debe ser un string'})
    @IsNotEmpty({ message: 'El campo nombre no puede estar vacío'})
    @MaxLength(30, { message: 'La nombre no puede exceder los 30 caracteres' })
    nombre: string;
    
    @ApiProperty({ description: 'Descripción del tipo', example: 'Esta es la descripción del tipo.', required:true})
    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío'})
    @MaxLength(255, { message: 'La descripcion no puede exceder los 255 caracteres' })
    descripcion: string;

}