// src/grupo-liquidaciones/dto/update-grupo-liquidacion.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateGrupoLiquidacionDto } from './create-grupoLiquidaciones.dto';

export class UpdateGrupoLiquidacionDto extends PartialType(CreateGrupoLiquidacionDto) {}