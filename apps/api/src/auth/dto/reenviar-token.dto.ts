import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, MaxLength } from "class-validator";

export class ReenviarTokenDto {
    
    @ApiProperty({ description: 'Email del usuario', example: 'usuario1@example.com', required:true})
    @IsEmail({}, {message: "Debe ser un email válido"})
    @IsNotEmpty({ message: 'El campo email no puede estar vacío' })
    @MaxLength(50, { message: 'El campo email no puede exceder los 50 caracteres' })
    email: string;

}
