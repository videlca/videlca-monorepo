import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";

export class CreatePermissionDto {    
    
    @IsString({ message: 'El campo ruta debe ser un string'})
    @IsNotEmpty({ message: 'El campo ruta no puede estar vacío' })
    @Transform(({ value }) => value.trim())
    ruta: string;
    
    @IsString({ message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío' })
    @Transform(({ value }) => value.trim())
    descripcion: string;
    
    @IsString({ message: 'El campo nombre debe ser un string'})
    @IsNotEmpty({ message: 'El campo nombre no puede estar vacío' })
    @Transform(({ value }) => value.trim())
    nombre: string;
    
    @IsString({ message: 'El campo modulo debe ser un string'})
    @IsNotEmpty({ message: 'El campo modulo no puede estar vacío' })
    @Transform(({ value }) => value.trim())
    modulo: string;
    
    @IsBoolean({message: 'El campo activo debe ser un boolean'})
    @IsOptional()
    activo?: boolean
    
    @IsBoolean({message: 'El campo modificar debe ser un boolean'})
    @IsOptional()
    modificar?: boolean

}
