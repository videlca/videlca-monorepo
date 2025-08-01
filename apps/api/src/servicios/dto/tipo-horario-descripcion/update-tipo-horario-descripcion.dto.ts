import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from "class-validator";

import { CreateTipoHorarioDescripcionDto } from './create-tipo-horario-descripcion.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatetipoHorarioDescripcionDto extends PartialType(CreateTipoHorarioDescripcionDto) {
    
    @ApiProperty({ description: 'Identificador de estado activo', example: true, required:false})
    @IsOptional()
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    estado?: boolean;

}
