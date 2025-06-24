import { IsNumber, IsOptional, IsPositive, IsBoolean, Min } from "class-validator";

export class UpdateUserStateRolDto {
    
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo Id Rol debe ser un número'})
    @IsPositive({message: 'El valor del campo Id Rol debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo Id Rol debe ser minimo 1'})
    idRol?: number;
    
    @IsOptional()
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    estado?: boolean;

}
