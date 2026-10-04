import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpdateObservacionOrdenServicioDto {

    @ApiProperty({ description: 'Descripción del tipo de Id', example: 'Esta es la descripción del tipo de id', required:true})
    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío'})
    @MaxLength(255, { message: 'La descripcion no puede exceder los 255 caracteres' })
    descripcion: string;

}
