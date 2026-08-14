import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive, Min } from "class-validator";

export class CreateTarifaHoraDto {

    @ApiProperty({ description: 'Id del periodo al que pertenece la tarifa hora', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo periodo debe ser un número'})
    @IsPositive({message: 'El valor del campo periodo debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo periodo debe ser minimo 1'})
    idPeriodo: number;

    @ApiProperty({ description: 'Id del tipo de tarifa hora descripcion (diurna, diurna dominical/festiva, nocturna, nocturna dominical/festiva)', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo tarifa hora descripcion debe ser un número'})
    @IsPositive({message: 'El valor del campo tarifa hora descripcion debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo tarifa hora descripcion debe ser minimo 1'})
    idTarifaHoraDescripcion: number;

    @ApiProperty({ description: 'costos directos de la tarifa hora', example: 1000, required:true})
    @IsNumber({}, {message: 'El valor del campo costos directos debe ser un número'})
    @IsPositive({message: 'El valor del campo costos directos debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo costos directos debe ser minimo 1'})
    costosDirectos: number;

    @ApiProperty({ description: 'seguro vida de la tarifa hora', example: 100, required:false})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo seguro vida debe ser un número'})
    @Min(0, {message: 'El valor del campo seguro vida debe ser minimo 0'})
    seguroVida?: number;

    @ApiProperty({ description: 'aui de la tarifa hora', example: 100, required:true})
    @IsNumber({}, {message: 'El valor del campo aui debe ser un número'})
    @IsPositive({message: 'El valor del campo aui debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo aui debe ser minimo 1'})
    aui: number;

}
