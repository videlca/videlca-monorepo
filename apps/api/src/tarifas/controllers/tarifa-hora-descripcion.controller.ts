import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

import { AppAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { TarifaHoraDescripcionService } from '../services/tarifa-hora-descripcion.service';

// Esta tabla solo se ajusta desde el backend (los datos se cargan directamente en la BD),
// por eso unicamente se exponen rutas de visualizacion
@Controller('tarifa-hora-descripcion')
@AppAuth(DescriptionRoutes.TARIFAS) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class TarifaHoraDescripcionController {

  constructor(private readonly tarifaHoraDescripcionService: TarifaHoraDescripcionService) {}

  // RUTA PROTEGIDA: OBTENER TODAS LAS TARIFA HORA DESCRIPCION
  @Get()
  findAll() {
    return this.tarifaHoraDescripcionService.findAll();
  }

  // RUTA PROTEGIDA: OBTENER UNA TARIFA HORA DESCRIPCION
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tarifaHoraDescripcionService.findOne(id);
  }

}
