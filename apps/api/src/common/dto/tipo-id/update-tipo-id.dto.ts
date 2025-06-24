import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from "class-validator";

import { CreateTipoIdDto } from './create-tipo-id.dto';

export class UpdatetipoIdDto extends PartialType(CreateTipoIdDto) {
    
    @IsOptional()
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    estado?: boolean;

}
