import { Controller } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

import { AppAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { LiquidacionesService } from '../../liquidaciones/services/liquidaciones.service';

@Controller('aprobacion-liquidacion-orden-servicio')
@AppAuth(DescriptionRoutes.APROBACION_LIQUIDACION_ORDENES_SERVICIO) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class AprobacionLiquidacionOrdenServicioController {
  constructor(
    private liquidacionesService: LiquidacionesService
  ) {}

}
