import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsNumberString, IsPositive, IsString, IsOptional, MaxLength, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CreateCorreoDto } from "../locacion/create-locacion.dto";

export class CreateClienteDto {

    @ApiProperty({ description: 'Número de identificacíon del cliente', example: '10000', required:true})
    @IsString({ message: 'El campo numero de identificacion debe ser un string'})
    @IsNotEmpty({ message: 'El campo numero de identificacion no puede estar vacío' })
    @MaxLength(50, { message: 'El campo numero de identificacion no puede exceder los 50 caracteres' })
    @IsNumberString({}, { message: 'Solo números permitidos' })
    numeroIdentificacion: string;
    
    @ApiProperty({ description: 'Id del tipo de identificación del cliente', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo Tipo de identificacion no puede estar vacio'})
    @IsPositive({message: 'El valor del campo Tipo de identificacion no puede estar vacio'})
    @Min(1, {message: 'El valor del campo Tipo de identificacion no puede estar vacio'})
    idTipoIdentificacion: number;

    @ApiProperty({ description: 'Nombre del cliente', example: 'Pepito Perez', required:true})
    @IsString({ message: 'El campo nombre debe ser un string'})
    @IsNotEmpty({ message: 'El campo nombre no puede estar vacío' })
    @MaxLength(50, { message: 'El campo nombre no puede exceder los 50 caracteres' })
    nombre: string;

    @ApiProperty({ description: 'Id el tipo de cliente', example: 1, required:true})
    @IsNumber({}, {message: 'El valor del campo Tipo de Cliente no puede estar vacio'})
    @IsPositive({message: 'El valor del campo Tipo de Cliente no puede estar vacio'})
    @Min(1, {message: 'El valor del campo Tipo de Cliente no puede estar vacio'})
    idTipoCliente: number;
    
    @ApiProperty({ description: 'id de la subsegmentación del cliente', example: 2, required:true})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo Sub Segmentacion no puede estar vacio'})
    @IsPositive({message: 'El valor del campo Sub Segmentacion no puede estar vacio'})
    @Min(1, {message: 'El valor del campo Sub Segmentacion no puede estar vacio'})
    idSubSegmentacion: number;
    

    // CONTACTOS QUE RECIBEN LAS NOTIFICACIONES DE LAS ORDENES ASIGNADAS DIRECTO AL CLIENTE (mismos datos que los
    // contactos de un puesto). Opcional: un cliente que solo tiene ordenes en sus puestos no los necesita. En la
    // actualizacion, si se envia reemplaza la lista completa (una lista vacia los elimina todos)
    @ApiProperty({ description: 'Contactos del cliente para las notificaciones de sus ordenes', type: [CreateCorreoDto], required: false })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateCorreoDto)
    correos?: CreateCorreoDto[];

}
