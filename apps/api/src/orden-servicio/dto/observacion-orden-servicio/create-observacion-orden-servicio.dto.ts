import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive, IsString, MaxLength, Min } from "class-validator";

export class CreateObservacionOrdenServicioDto {

    @ApiProperty({ description: 'Descripción del tipo de Id', example: 'Esta es la descripción del tipo de id', required:true})
    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío'})
    @MaxLength(255, { message: 'La descripcion no puede exceder los 255 caracteres' })
    descripcion: string;
    
    @ApiProperty({ description: 'id de la orden de servicio a la que se enlazara el comentario', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo id orden servicio debe ser un número'})
    @IsPositive({message: 'El valor del campo id orden servicio  debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo id orden servicio  debe ser minimo 1'})
    idOrdenServicio: number;

}
