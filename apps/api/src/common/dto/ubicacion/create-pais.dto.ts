import { IsString, IsNotEmpty } from "class-validator";

export class CreatePaisDto {
    
    @IsString({message: 'El campo descripcion debe ser un string'})
    @IsNotEmpty({ message: 'El campo descripcion no puede estar vacío'})
    descripcion: string;

}