import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from "class-validator";

import { CreateEstadoAppDto } from './create-estado-app.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEstadoAppDto extends PartialType(CreateEstadoAppDto) {
    
    @ApiProperty({ description: 'Identificador de estado activo', example: true, required:false})
    @IsOptional()
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    estado?: boolean;

}
