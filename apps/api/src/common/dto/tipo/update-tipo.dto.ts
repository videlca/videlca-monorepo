import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from "class-validator";

import { CreateTipoDto } from './create-tipo.dto';

export class UpdatetipoDto extends PartialType(CreateTipoDto) {
    
    @IsOptional()
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    estado?: boolean;

}
