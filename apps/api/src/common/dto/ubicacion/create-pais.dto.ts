import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class CreatePaisDto {
    
    @ApiProperty({ description: 'Descripción del Pais', example: 'Esta es la descripción del país', required:true})
    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío'})
    descripcion: string;

}