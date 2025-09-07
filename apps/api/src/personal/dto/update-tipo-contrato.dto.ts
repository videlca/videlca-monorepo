import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from "class-validator";

import { CreateTipoContratoDto } from './create-tipo-contrato.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatetipoContratoDto extends PartialType(CreateTipoContratoDto) {
    
    @ApiProperty({ description: 'Identificador de estado activo', example: true, required:false})
    @IsOptional()
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    estado?: boolean;

}
