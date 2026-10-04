import { PartialType, OmitType, ApiProperty } from '@nestjs/swagger';
import { CreateSegmentacionDto } from './create-segmentacion.dto';
import { IsBoolean, IsOptional } from 'class-validator';

// Omitimos subSegmentaciones porque no queremos actualizar subsegmentaciones en este endpoint
export class UpdateSegmentacionDto extends PartialType(
  OmitType(CreateSegmentacionDto, ['subSegmentaciones'])
) {
    @ApiProperty({ description: 'identificador de estado activo', example: true, required:false})
    @IsOptional()
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    estado?: boolean;

}