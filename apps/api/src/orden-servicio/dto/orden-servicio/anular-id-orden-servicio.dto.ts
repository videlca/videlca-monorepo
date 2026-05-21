import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsNumber, IsOptional } from "class-validator";

export class AnularIdOrdenServicioDto {

    @ApiProperty({ 
        description: 'descripcion del numero de la orden a anular', 
        example: 'A-234567', 
        required:true
    })
    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío'})
    // @MaxLength(100, { message: 'La descripcion no puede exceder los 100 caracteres' })
    descripcionId: string;

    @ApiProperty({ 
        description: 'Motivo de la anulacion del numero de orden', 
        example: 'El numero de orden fue creado por error',
        required:false
    })
    @IsOptional()
    @IsString({message: 'El campo motivo debe ser un string'})
    motivo?: string;

    @ApiProperty({ 
        description: 'Consecutivo del numero de la orden a anular', 
        example: 123456, 
        required:true
    })
    @IsNumber({}, { message: 'El campo consecutivo debe ser un número' })
    consecutivo: number;

}