import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty } from "class-validator";

export class UpdatePermissionStateDto {
    
    @ApiProperty({ description: 'Identificador de si está activo', example: true, required:true})
    @IsBoolean({message: 'El campo activo debe ser un boolean'})
    @IsNotEmpty({ message: 'El campo activo no puede estar vacío' })
    activo: boolean;

}
