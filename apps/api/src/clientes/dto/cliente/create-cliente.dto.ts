import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsNumberString,  IsPositive, IsString, MaxLength, Min } from "class-validator";

export class CreateClienteDto {

    @ApiProperty({ description: 'Número de identificacíon del cliente', example: '10000', required:true})
    @IsString({ message: 'El campo numero de identificacion debe ser un string'})
    @IsNotEmpty({ message: 'El campo numero de identificacion no puede estar vacío' })
    @MaxLength(50, { message: 'El campo numero de identificacion no puede exceder los 50 caracteres' })
    @IsNumberString({}, { message: 'Solo números permitidos' })
    numeroIdentificacion: string;
    
    @ApiProperty({ description: 'Id del tipo de identificación del cliente', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo Tipo de identificacion debe ser un número'})
    @IsPositive({message: 'El valor del campo Tipo de identificacion debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo Tipo de identificacion debe ser minimo 1'})
    idTipoIdentificacion: number;

    @ApiProperty({ description: 'Nombre del cliente', example: 'Pepito Perez', required:true})
    @IsString({ message: 'El campo nombre debe ser un string'})
    @IsNotEmpty({ message: 'El campo nombre no puede estar vacío' })
    @MaxLength(50, { message: 'El campo nombre no puede exceder los 50 caracteres' })
    nombre: string;

    @ApiProperty({ description: 'Id el tipo de cliente', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo Tipo de Cliente debe ser un número'})
    @IsPositive({message: 'El valor del campo Tipo de Cliente debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo Tipo de Cliente debe ser minimo 1'})
    idTipoCliente: number;
    
    @ApiProperty({ description: 'id de la subsegmentación del cliente', example: 2, required:true})
    @IsNumber({}, {message: 'El valor del campo Sub Segmentacion debe ser un número'})
    @IsPositive({message: 'El valor del campo Sub Segmentacion debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo Sub Segmentacion debe ser minimo 1'})
    idSubSegmentacion: number;
    
}
