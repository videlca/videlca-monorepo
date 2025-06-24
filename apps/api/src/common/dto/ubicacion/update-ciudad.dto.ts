import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from "class-validator";

import { CreateCiudadDto } from './create-ciudad.dto';

export class UpdateCiudadDto extends PartialType(CreateCiudadDto) {
    
    @IsOptional()
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    estado?: boolean;

}
