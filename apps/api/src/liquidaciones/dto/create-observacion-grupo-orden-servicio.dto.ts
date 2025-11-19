import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive, IsString, MaxLength, Min } from "class-validator";

export class CreateObservacionGrupoOrdenServicioDto {

    @ApiProperty({ description: 'observacion a colocar para el grupo', example: 'observacion', required:true})
    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío'})
    @MaxLength(255, { message: 'La descripcion no puede exceder los 255 caracteres' })
    descripcion: string;
    
    @ApiProperty({ description: 'id del grupo de orden de servicio a la que se enlazara el comentario', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo id del grupo de orden servicio debe ser un número'})
    @IsPositive({message: 'El valor del campo id del grupo de orden servicio  debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo id del grupo de orden servicio debe ser minimo 1'})
    idGrupoOrdenServicio: number;

}
