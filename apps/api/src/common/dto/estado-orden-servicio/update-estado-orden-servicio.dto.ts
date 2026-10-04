import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from "class-validator";

import { CreateEstadoOrdenDto } from './create-estado-orden-servicio.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEstadoOrdenDto extends PartialType(CreateEstadoOrdenDto) {
    
    @ApiProperty({ description: 'Identificador de estado activo', example: true, required:false})
    @IsOptional()
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    estado?: boolean;

}
