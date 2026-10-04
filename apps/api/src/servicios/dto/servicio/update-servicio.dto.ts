import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateServicioDto } from './create-servicio.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateServicioDto extends PartialType(CreateServicioDto) {

    @ApiProperty({ description: 'Identificador del estado activo', example: true, required:false})
    @IsOptional()
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    estado?: boolean;

}
