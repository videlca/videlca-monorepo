import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from "class-validator";

export class CreateTipoTarifaDto {

    @ApiProperty({ description: 'nombre del tipo de tarifa', example: 'mes', required:true})
    @IsString({message: 'El campo nombre debe ser un string'})
    @IsNotEmpty({ message: 'El campo nombre no puede estar vacío'})
    @MaxLength(100, { message: 'La nombre no puede exceder los 100 caracteres' })
    nombre: string;
    
    @ApiProperty({ description: 'Descripción del tipo de tarifa', example: 'Esta es la descripción del tipo de tarifa', required:true})
    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío'})
    @MaxLength(100, { message: 'La descripcion no puede exceder los 100 caracteres' })
    descripcion: string;
    
    @ApiProperty({ description: 'Id del tipo de unidad de tiempo para el tipo de tarifa', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo tipo unidad de tiempo debe ser un número'})
    @IsPositive({message: 'El valor del campo tipo unidad de tiempo debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo tipo unidad de tiempo debe ser minimo 1'})
    idTipoUnidadTiempo: number;
    
    @ApiProperty({ description: 'Cantidad de tiempo que representa el tipo de unidad de tiempo', example: 1, required:true})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo cantidad de tiempo debe ser un número'})
    @IsPositive({message: 'El valor del campo cantidad de tiempo debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo cantidad de tiempo debe ser minimo 1'})
    cantidadTiempo?: number;
    
}
