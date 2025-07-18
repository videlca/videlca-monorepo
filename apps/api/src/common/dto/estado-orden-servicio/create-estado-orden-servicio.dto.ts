import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateEstadoOrdenDto {

    @ApiProperty({ description: 'nombre del tipo del estado de orden', example: 'nombre', required:true})
    @IsString({message: 'El campo nombre debe ser un string'})
    @IsNotEmpty({ message: 'El campo nombre no puede estar vacío'})
    @MaxLength(100, { message: 'La nombre no puede exceder los 100 caracteres' })
    nombre: string;
    
    @ApiProperty({ description: 'nombre del tipo', example: 'Esta es la descripción del tipo.', required:true})
    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío'})
    @MaxLength(100, { message: 'La descripcion no puede exceder los 100 caracteres' })
    descripcion: string;

}