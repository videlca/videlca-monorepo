import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsString, IsEmail, Length, ArrayMinSize, ValidateNested } from 'class-validator';

export class CorreosDto {
    
    @ApiProperty({ description: 'email', example: 'example@example.com', required:true})
    @IsString({message: 'El campo email debe ser un string'})
    @IsNotEmpty({ message: 'El campo email no puede estar vacío' })
    @IsEmail({}, { message: 'El correo no es válido' })
    @Length(1, 100, { message: 'El campo email debe tener entre 1 y 100 caracteres' })
    email: string;

}

export class EnviarCorreoDto {

  // Array de correos (mínimo 1)
  @IsArray()
  @ArrayMinSize(1, { message: 'se debe enviar al menos un correo' })
  @ValidateNested({ each: true })
  @Type(() => CorreosDto)
  correos: CorreosDto[];

}