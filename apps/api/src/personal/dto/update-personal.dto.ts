import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';

import { CreatePersonalDto } from './create-personal.dto';

export class UpdatePersonalDto extends PartialType(CreatePersonalDto) {

    @IsOptional()
    @IsBoolean()
    laborando?: boolean;

}
