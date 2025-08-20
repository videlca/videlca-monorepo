import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class AnularIdOrdenServicioDto {

    @ApiProperty({ 
        description: 'descripcion del numero de la orden a anular', 
        example: 'A-234567', 
        required:true
    })
    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío'})
    @MaxLength(100, { message: 'La descripcion no puede exceder los 100 caracteres' })
    descripcionId: string;

}