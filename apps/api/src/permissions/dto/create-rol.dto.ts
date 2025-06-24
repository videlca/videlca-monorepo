import { IsArray, IsNotEmpty, IsNumber, IsString, MaxLength } from "class-validator";
import { Transform } from "class-transformer";

export class CreateRoleDto {
    
    @IsArray()
    @IsNumber({}, {each: true, message: 'Los valores de los Permisos deben ser un número'})
    permissionsIds: number[];
    
    @IsString({ message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío' })
    @MaxLength(50, { message: 'El campo descripcion no puede exceder los 50 caracteres'})
    @Transform(({ value }) => value.trim())
    descripcion: string;

}