import { IsNotEmpty, IsNumber, IsPositive, IsString, MaxLength, Min } from "class-validator";

export class CreateClienteDto {

    @IsString({ message: 'El campo numero de identificacion debe ser un string'})
    @IsNotEmpty({ message: 'El campo numero de identificacion no puede estar vacío' })
    @MaxLength(50, { message: 'El campo numero de identificacion no puede exceder los 50 caracteres' })
    numeroIdentificacion: string;
    
    @IsNumber({}, {message: 'El valor del campo Tipo de de identificacion debe ser un número'})
    @IsPositive({message: 'El valor del campo Tipo de identificacion debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo Tipo de identificacion debe ser minimo 1'})
    idTipoIdentificacion: number;

    @IsString({ message: 'El campo nombre debe ser un string'})
    @IsNotEmpty({ message: 'El campo nombre no puede estar vacío' })
    @MaxLength(50, { message: 'El campo nombre no puede exceder los 50 caracteres' })
    nombre: string;

    @IsNumber({}, {message: 'El valor del campo Tipo de Cliente debe ser un número'})
    @IsPositive({message: 'El valor del campo Tipo de Cliente debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo Tipo de Cliente debe ser minimo 1'})
    idTipoCliente: number;
    
    @IsNumber({}, {message: 'El valor del campo Sub Segmentacion debe ser un número'})
    @IsPositive({message: 'El valor del campo Sub Segmentacion debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo Sub Segmentacion debe ser minimo 1'})
    idSubSegmentacion: number;
    
}
