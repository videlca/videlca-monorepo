import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateTipoServicioDto {

    @ApiProperty({ description: 'nombre del tipo de servicio', example: 'nombre', required:true})
    @IsString({message: 'El campo nombre debe ser un string'})
    @IsNotEmpty({ message: 'El campo nombre no puede estar vacío'})
    @MaxLength(100, { message: 'La nombre no puede exceder los 100 caracteres' })
    nombre: string;
    
    @ApiProperty({ description: 'descripcion del tipo', example: 'Esta es la descripción del tipo.', required:true})
    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío'})
    @MaxLength(100, { message: 'La descripcion no puede exceder los 100 caracteres' })
    descripcion: string;
    
    @ApiProperty({ description: 'prefijo del tipo de servicio', example: 'OS', required:true})
    @IsString({message: 'El campo prefijo debe ser un string'})
    @IsNotEmpty({ message: 'El campo prefijo no puede estar vacío'})
    @MaxLength(10, { message: 'El prefijo no puede exceder los 10 caracteres' })
    prefijo: string;

    @ApiProperty({ description: 'Identificador de si requiere personal activo', example: true, required: true})
    @IsBoolean({message: 'El campo requiere personal debe ser boolean'})
    requierePersonal: boolean;

}