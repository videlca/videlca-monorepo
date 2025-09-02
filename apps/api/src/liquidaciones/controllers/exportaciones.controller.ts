import { Controller } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

import { AppAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { LiquidacionesService } from '../../liquidaciones/services/liquidaciones.service';

@Controller('exportacion')
@AppAuth(DescriptionRoutes.EXPORTACIONES) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class ExportacionController {
  constructor(
    private liquidacionesService: LiquidacionesService
  ) {}

}
