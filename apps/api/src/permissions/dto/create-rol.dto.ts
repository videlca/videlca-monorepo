import { IsArray, IsNotEmpty, IsNumber, IsString, MaxLength } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class CreateRoleDto {

    @ApiProperty({ description: 'Permisos del rol', example: [1, 2, 3], required:true})
    @IsArray()
    @IsNumber({}, {each: true, message: 'Los valores de los Permisos deben ser un número'})
    permissionsIds: number[];
    
    @ApiProperty({ description: 'Descripción del rol', example: 'Esta es la descripción del rol 1', required:true})
    @IsString({ message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío' })
    @MaxLength(50, { message: 'El campo descripcion no puede exceder los 50 caracteres'})
    @Transform(({ value }) => value.trim())
    descripcion: string;

}