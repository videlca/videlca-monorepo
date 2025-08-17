import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive, IsString, MaxLength, Min } from "class-validator";

export class CreateTarifaDto {
    
    @ApiProperty({ description: 'Id del periodo donde se va a incluir el servicio', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo periodo debe ser un número'})
    @IsPositive({message: 'El valor del campo periodo debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo periodo debe ser minimo 1'})
    idPeriodo: number;
    
    @ApiProperty({ description: 'Id del servicio que se va a incluir a un periodo', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo servicio debe ser un número'})
    @IsPositive({message: 'El valor del campo servicio debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo servicio debe ser minimo 1'})
    idServicio: number;
    
    @ApiProperty({ description: 'Id del tipo tarifa para el servicio', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo tipo tarifa debe ser un número'})
    @IsPositive({message: 'El valor del campo tipo tarifa debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo tipo tarifa debe ser minimo 1'})
    idTipoTarifa: number;

    @ApiProperty({ description: 'costos directos del servicio', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo costos directos debe ser un número'})
    @IsPositive({message: 'El valor del campo costos directos debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo costos directos debe ser minimo 1'})
    costosDirectos: number;
    
    @ApiProperty({ description: 'seguro vida del servicio', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo seguro vida debe ser un número'})
    @Min(0, {message: 'El valor del campo seguro vida debe ser minimo 0'})
    seguroVida: number;
    
    @ApiProperty({ description: 'costos directos + seguro vida del servicio', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo costos directos + seguro vida debe ser un número'})
    @IsPositive({message: 'El valor del campo costos directos + seguro vida debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo costos directos + seguro vida debe ser minimo 1'})
    costosDirectosSeguroVida: number;

    @ApiProperty({ description: 'aui del servicio', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo aui debe ser un número'})
    @IsPositive({message: 'El valor del campo aui debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo aui debe ser minimo 1'})
    aui: number;
    
    @ApiProperty({ description: 'precio antes iva del servicio', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo precio antes iva debe ser un número'})
    @IsPositive({message: 'El valor del campo precio antes iva debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo precio antes iva debe ser minimo 1'})
    precioAntesIva: number;
    
    @ApiProperty({ description: 'iva del precio del servicio', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo iva debe ser un número'})
    @IsPositive({message: 'El valor del campo iva debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo iva debe ser minimo 1'})
    iva: number;
    
    @ApiProperty({ description: 'precio total del servicio del servicio', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo precio total debe ser un número'})
    @IsPositive({message: 'El valor del campo precio total debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo precio total debe ser minimo 1'})
    precioTotal: number;
    
}
