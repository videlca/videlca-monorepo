import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MaxLength } from "class-validator";

export class ReestablecerDatosDto {
    
    @ApiProperty({ description: 'Número de identificación del usuario:', example: '122233344455', required:true})
    @IsString({ message: 'El campo numero de identificacion debe ser un string'})
    @IsNotEmpty({ message: 'El campo numero identificacion no puede estar vacío' })
    @MaxLength(50, { message: 'El campo numero identificacion no puede exceder los 50 caracteres' })
    nroIdentificacion: string;

}
