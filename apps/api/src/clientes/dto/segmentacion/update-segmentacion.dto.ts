import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateSegmentacionDto } from './create-segmentacion.dto';
import { IsBoolean, IsOptional } from 'class-validator';

// Omitimos subSegmentaciones porque no queremos actualizar subsegmentaciones en este endpoint
export class UpdateSegmentacionDto extends PartialType(
  OmitType(CreateSegmentacionDto, ['subSegmentaciones'])
) {

    @IsOptional()
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    estado?: boolean;

}