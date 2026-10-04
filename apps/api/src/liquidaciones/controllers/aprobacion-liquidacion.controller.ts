import { Controller, Get, Post, Delete, Param, ParseIntPipe } from '@nestjs/common';

import { AppAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { LiquidacionesService } from '../../liquidaciones/services/liquidaciones.service';

@Controller('aprobacion-liquidacion-orden-servicio')
@AppAuth(DescriptionRoutes.APROBACION_LIQUIDACION_ORDENES_SERVICIO) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class AprobacionLiquidacionOrdenServicioController {
  constructor(
    private liquidacionesService: LiquidacionesService
  ) {}

  @Get('buscar-grupos-liquidaciones')
  async buscarGrupoLiquidaciones() {
    return this.liquidacionesService.buscarGrupoLiquidaciones();
  }

  @Post(':idGrupoLiquidacion/liquidar-grupo')
  async confirmar(@Param('idGrupoLiquidacion', ParseIntPipe) idGrupoLiquidacion: number) {
    return this.liquidacionesService.liquidarGrupo(idGrupoLiquidacion);
  }

  @Delete(':idGrupoLiquidacion/desintegrar-grupo')
  async desintegrarGrupo(@Param('idGrupoLiquidacion', ParseIntPipe) idGrupoLiquidacion: number) {
    return this.liquidacionesService.desintegrarGrupo(idGrupoLiquidacion);
  }

}
