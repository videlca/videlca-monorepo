import { IsString, IsNotEmpty, MaxLength } from "class-validator";

export class ReestablecerDatosDto {
    
    @IsString({ message: 'El campo numero de identificacion debe ser un string'})
    @IsNotEmpty({ message: 'El campo numero identificacion no puede estar vacío' })
    @MaxLength(50, { message: 'El campo numero identificacion no puede exceder los 50 caracteres' })
    nroIdentificacion: string;

}
