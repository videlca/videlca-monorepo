import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsString, IsEmail, Length, ArrayMinSize, ValidateNested } from 'class-validator';

export class CreateCorreoDefaultDto {

    @ApiProperty({ description: 'descripcion del tipo del correo', example: 'gerencia', required:true})
    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty()
    @Length(1, 50, {message: 'El campo descripcion debe tener entre 1 y 50 caracteres'})
    descripcion: string;
    
    @ApiProperty({ description: 'email', example: 'example@example.com', required:true})
    @IsString()
    @IsNotEmpty()
    @IsEmail({}, { message: 'El correo no es válido' })
    @Length(1, 100, { message: 'El campo email debe tener entre 1 y 100 caracteres' })
    email: string;

    @IsArray()
    @ArrayMinSize(1, { message: 'El correo debe tener al menos un estado de orden de servicio' })
    @IsNotEmpty({ each: true })
    estados: number[]; // Array de IDs de estados
    
    @IsArray()
    @ArrayMinSize(1, { message: 'El correo debe tener al menos un estado de app' })
    @IsNotEmpty({ each: true })
    estadosApp: number[];

}


export class CorreoDefaultDto {

  // Array de correos (mínimo 1)
  @IsArray()
  @ArrayMinSize(1, { message: 'se debe enviar al menos un correo' })
  @ValidateNested({ each: true })
  @Type(() => CreateCorreoDefaultDto)
  correos: CreateCorreoDefaultDto[];

}