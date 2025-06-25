import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive, IsBoolean, Min } from "class-validator";

export class UpdateUserStateRolDto {

    @ApiProperty({ description: 'Rol del usuario', example: 1, required:true})
    @IsOptional()
    @IsNumber({}, {message: 'El valor del campo Id Rol debe ser un número'})
    @IsPositive({message: 'El valor del campo Id Rol debe ser un numero positivo'})
    @Min(1, {message: 'El valor del campo Id Rol debe ser minimo 1'})
    idRol?: number;
    
    @ApiProperty({ description: 'Estado del usuario', example: true, required:false})
    @IsOptional()
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    estado?: boolean;

}
