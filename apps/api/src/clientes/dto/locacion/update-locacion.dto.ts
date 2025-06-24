import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateLocacionDto } from './create-locacion.dto';

export class UpdateLocacionDto extends PartialType(CreateLocacionDto) {

    @IsOptional()
    @IsBoolean({message: 'El campo estado debe ser boolean'})
    estado?: boolean;

}
