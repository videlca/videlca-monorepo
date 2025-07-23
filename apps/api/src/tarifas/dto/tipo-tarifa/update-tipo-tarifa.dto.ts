import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateTipoTarifaDto } from './create-tipo-tarifa.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTipoTarifaDto extends PartialType(CreateTipoTarifaDto) {

    @ApiProperty({ description: 'Identificador de estado activo', example: true, required:false})
    @IsOptional()
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    estado?: boolean;

}
