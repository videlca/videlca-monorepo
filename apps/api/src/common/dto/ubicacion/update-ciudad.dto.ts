import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from "class-validator";

import { CreateCiudadDto } from './create-ciudad.dto';

export class UpdateCiudadDto extends PartialType(CreateCiudadDto) {
    
    @ApiProperty({ description: 'Identificacdor del estado activo', example: true, required:false})
    @IsOptional()
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    estado?: boolean;

}
