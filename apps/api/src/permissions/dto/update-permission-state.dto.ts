import { IsBoolean, IsNotEmpty } from "class-validator";

export class UpdatePermissionStateDto {
    
    @IsBoolean({message: 'El campo activo debe ser un boolean'})
    @IsNotEmpty({ message: 'El campo activo no puede estar vacío' })
    activo: boolean;

}
