import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

import { AppAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { LiquidacionesService } from '../../liquidaciones/services/liquidaciones.service';
import { FiltroGrupoLiquidacionDto } from '../dto/filtroGrupoLiquidacion.dto';

@Controller('exportacion')
@AppAuth(DescriptionRoutes.EXPORTACIONES) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class ExportacionController {
  
  constructor(
    private liquidacionesService: LiquidacionesService
  ) {}

  @Get('buscar-por-campo')
  async buscarPorCampoEstado(@Query() filtro: FiltroGrupoLiquidacionDto) {
    return this.liquidacionesService.findGruposPorCampoEstado(filtro.campo, filtro.valor);
  }

}
