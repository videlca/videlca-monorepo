import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsPositive, Min } from "class-validator";

export class CreateTarifaHoraDto {

    @ApiProperty({ description: 'Id del periodo al que pertenece la tarifa hora', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo periodo debe ser un número'})
    @IsPositive({message: 'El valor del campo periodo debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo periodo debe ser minimo 1'})
    idPeriodo: number;

    @ApiProperty({ description: 'Id del tipo de tarifa hora descripcion (diurna, diurna dominical/festiva, nocturna, nocturna dominical/festiva, seguro de vida)', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo tarifa hora descripcion debe ser un número'})
    @IsPositive({message: 'El valor del campo tarifa hora descripcion debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo tarifa hora descripcion debe ser minimo 1'})
    idTarifaHoraDescripcion: number;

    @ApiProperty({ description: 'precio de la tarifa hora', example: 1000, required:true})
    @IsNumber({}, {message: 'El valor del campo precio debe ser un número'})
    @IsPositive({message: 'El valor del campo precio debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo precio debe ser minimo 1'})
    precio: number;

}
