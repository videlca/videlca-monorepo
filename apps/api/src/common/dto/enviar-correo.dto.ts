import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsString, IsEmail, Length, ArrayMinSize, ValidateNested } from 'class-validator';

export class CorreosDto {
    
    @ApiProperty({ description: 'email', example: 'example@example.com', required:true})
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    @Length(1, 100)
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