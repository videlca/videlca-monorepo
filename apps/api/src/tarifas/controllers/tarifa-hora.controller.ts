import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe } from '@nestjs/common';

import { AppAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { TarifaHoraService } from '../services/tarifa-hora.service';
import { SaveTarifaHoraDto } from '../dto';

@Controller('tarifas-hora')
@AppAuth(DescriptionRoutes.TARIFAS) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class TarifaHoraController {

  constructor(private readonly tarifaHoraService: TarifaHoraService) {}

  // RUTA PROTEGIDA: crear/actualizar (upsert) las 4 tarifas por hora de un periodo
  @Post('guardar')
  guardar(@Body() saveTarifaHoraDto: SaveTarifaHoraDto) {
    return this.tarifaHoraService.guardarTarifasHora(saveTarifaHoraDto);
  }

  // RUTA PROTEGIDA: OBTENER LAS TARIFAS POR HORA DE UN PERIODO (valores si ya existen, o solo la descripcion si aun no se han creado)
  @Get('periodo/:idPeriodo')
  findAllByPeriodo(@Param('idPeriodo', ParseIntPipe) idPeriodo: number) {
    return this.tarifaHoraService.findAllByPeriodo(idPeriodo);
  }

  // RUTA PROTEGIDA: OBTENER UNA TARIFA HORA
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tarifaHoraService.findOne(id);
  }

  // RUTA PROTEGIDA: ELIMINAR UNA TARIFA HORA
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tarifaHoraService.remove(id);
  }

}
