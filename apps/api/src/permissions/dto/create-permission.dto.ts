import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePermissionDto {    
    
    @ApiProperty({ description: 'Descripción de la ruta', example: 'Descripción de la ruta 1', required:true})
    @IsString({ message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío' })
    @Transform(({ value }) => value.trim())
    descripcion: string;
    
    @ApiProperty({ description: 'Nombre del permiso', example: 'Permiso 1', required:true})
    @IsString({ message: 'El campo nombre debe ser un string'})
    @IsNotEmpty({ message: 'El campo nombre no puede estar vacío' })
    @Transform(({ value }) => value.trim())
    nombre: string;

}
