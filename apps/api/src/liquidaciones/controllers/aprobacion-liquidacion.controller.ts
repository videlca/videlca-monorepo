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

  @Post(':id/liquidar-grupo')
  async confirmar(@Param('id', ParseIntPipe) id: number) {
    return this.liquidacionesService.liquidarGrupo(id);
  }

  @Delete(':id/desintegrar-grupo')
  async desintegrarGrupo(@Param('id', ParseIntPipe) id: number) {
    return this.liquidacionesService.desintegrarGrupo(id);
  }

}
