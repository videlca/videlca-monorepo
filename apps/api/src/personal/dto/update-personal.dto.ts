import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

import { CreatePersonalDto } from './create-personal.dto';

export class UpdatePersonalDto extends PartialType(CreatePersonalDto) {

    @ApiProperty({ description: 'Identificador de si está laborando', example: true, required:false})
    @IsOptional()
    @IsBoolean()
    laborando?: boolean;

}
