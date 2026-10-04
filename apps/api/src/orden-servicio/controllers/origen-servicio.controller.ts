import { Controller, Get } from '@nestjs/common';

import { AppAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { OrigenServicioService } from '../services/origen-servicio.service';

// Esta tabla solo se ajusta desde el backend (los datos se cargan directamente en la BD),
// por eso unicamente se expone una ruta de visualizacion
@Controller('origen-servicio')
@AppAuth(DescriptionRoutes.ORDENES_SERVICIO) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class OrigenServicioController {

  constructor(private readonly origenServicioService: OrigenServicioService) {}

  // RUTA PROTEGIDA: OBTENER TODOS LOS ORIGEN SERVICIO
  @Get()
  findAll() {
    return this.origenServicioService.findAll();
  }

}
