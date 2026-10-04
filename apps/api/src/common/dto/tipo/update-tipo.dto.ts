import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from "class-validator";

import { CreateTipoDto } from './create-tipo.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatetipoDto extends PartialType(CreateTipoDto) {
    
    @ApiProperty({ description: 'Identificador de estado activo', example: true, required:false})
    @IsOptional()
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    estado?: boolean;

}
