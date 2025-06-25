import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePermissionDto {    

    @ApiProperty({ description: 'Ruta', example: 'Ruta1', required:true})
    @IsString({ message: 'El campo ruta debe ser un string'})
    @IsNotEmpty({ message: 'El campo ruta no puede estar vacío' })
    @Transform(({ value }) => value.trim())
    ruta: string;
    
    @ApiProperty({ description: 'Descripción del a ruta', example: 'Descripción de la ruta 1', required:true})
    @IsString({ message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío' })
    @Transform(({ value }) => value.trim())
    descripcion: string;
    
    @ApiProperty({ description: 'Nombre del permiso', example: 'Permiso 1', required:true})
    @IsString({ message: 'El campo nombre debe ser un string'})
    @IsNotEmpty({ message: 'El campo nombre no puede estar vacío' })
    @Transform(({ value }) => value.trim())
    nombre: string;
    
    @ApiProperty({ description: 'Nombre del módulo', example: 'Modulo 1', required:true})
    @IsString({ message: 'El campo modulo debe ser un string'})
    @IsNotEmpty({ message: 'El campo modulo no puede estar vacío' })
    @Transform(({ value }) => value.trim())
    modulo: string;
    
    @ApiProperty({ description: 'Identificador de si está activo', example: true, required:false})
    @IsBoolean({message: 'El campo activo debe ser un boolean'})
    @IsOptional()
    activo?: boolean
    
    @ApiProperty({ description: 'Modificar', example: true, required:false})
    @IsBoolean({message: 'El campo modificar debe ser un boolean'})
    @IsOptional()
    modificar?: boolean

}
