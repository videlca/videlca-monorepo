import { PartialType } from '@nestjs/swagger';
import { CreateInicioDto } from './create-inicio.dto';

export class UpdateInicioDto extends PartialType(CreateInicioDto) {}
