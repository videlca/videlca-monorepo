import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateTipoUnidadTiempoDto } from './create-tipo-unidad-tiempo.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTipoUnidadTiempoDto extends PartialType(CreateTipoUnidadTiempoDto) {

    @ApiProperty({ description: 'Identificador de estado activo', example: true, required:false})
    @IsOptional()
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    estado?: boolean;

}
