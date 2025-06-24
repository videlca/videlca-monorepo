import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class LoginUserDto {
    
    @IsEmail({}, {message: "Debe ser un email válido"})
    @IsNotEmpty({ message: 'El campo email no puede estar vacío' })
    @MaxLength(50, { message: 'El campo email no puede exceder los 50 caracteres' })
    email: string;
  
    @IsString({ message: 'El campo clave debe ser un string'})
    @IsNotEmpty({ message: 'El campo clave no puede estar vacío'})
    clave: string;

}
