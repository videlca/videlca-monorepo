import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateEstadoAppDto {

    @ApiProperty({ description: 'nombre del tipo del estado de app', example: 'nombre del estado de app', required:true})
    @IsString({message: 'El campo nombre debe ser un string'})
    @IsNotEmpty({ message: 'El campo nombre no puede estar vacío'})
    @MaxLength(100, { message: 'La nombre no puede exceder los 100 caracteres' })
    nombre: string;
    
    @ApiProperty({ description: 'descripcion del estado de app', example: 'Esta es la descripción del estado de la app.', required:true})
    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío'})
    @MaxLength(255, { message: 'La descripcion no puede exceder los 255 caracteres' })
    descripcion: string;

}