import { PartialType } from '@nestjs/swagger';
import { CreateLiquidacioneDto } from './create-liquidacione.dto';

export class UpdateLiquidacioneDto extends PartialType(CreateLiquidacioneDto) {}
