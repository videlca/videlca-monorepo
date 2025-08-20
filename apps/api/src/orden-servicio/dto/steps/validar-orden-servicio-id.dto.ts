import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class ValidarIdOrdenServicioDto {

    @ApiProperty({ description: 'Numero de orden de la orden de servicio', example: 'A-23456', required:true})
    @IsString({ message: 'El campo descripcion id debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion id no puede estar vacío'})
    @MaxLength(100, { message: 'El campo descripcion id no puede exceder los 100 caracteres' })
    descripcionId: string;

}