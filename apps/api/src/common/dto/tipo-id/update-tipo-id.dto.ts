import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from "class-validator";

import { CreateTipoIdDto } from './create-tipo-id.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatetipoIdDto extends PartialType(CreateTipoIdDto) {
    
    @ApiProperty({ description: 'Identificador de estado activo', example: true, required:false})
    @IsOptional()
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    estado?: boolean;

}
