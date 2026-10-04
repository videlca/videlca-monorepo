import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from "class-validator";

import { CreateTipoServicioDto } from './create-tipo-servicio.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTipoServicioDto extends PartialType(CreateTipoServicioDto) {
    
    @ApiProperty({ description: 'Identificador de estado activo', example: true, required:false})
    @IsOptional()
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    estado?: boolean;

}
