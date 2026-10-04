import { PartialType } from '@nestjs/swagger';
import { CreateTipoHorarioDto } from './create-tipo-horario.dto';

export class UpdateTipoHorarioDto extends PartialType(CreateTipoHorarioDto) {}