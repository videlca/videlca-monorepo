import { IsEmail, IsNotEmpty, MaxLength } from "class-validator";

export class ReenviarTokenDto {
    
    @IsEmail({}, {message: "Debe ser un email válido"})
    @IsNotEmpty({ message: 'El campo email no puede estar vacío' })
    @MaxLength(50, { message: 'El campo email no puede exceder los 50 caracteres' })
    email: string;

}
