import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { PaginationDto } from '../../common/dto';

import { TarifasService } from '../services/tarifas.service';
import { CreateTarifaDto, UpdateTarifaDto } from '../dto';

@Controller('tarifas')
@AppAuth(DescriptionRoutes.TARIFAS) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class TarifasController {
  constructor(private readonly tarifasService: TarifasService) {}
  
  // RUTA PROTEGIDA: Crear tarifa para un periodo
  @Post()
  create(@Body() createTarifaDto: CreateTarifaDto) {
    return this.tarifasService.create(createTarifaDto);
  }
  
  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS LAS TARIFAS DE UN PERIODO
  @Get('periodo/:idPeriodo')
  findAllByPeriodo(@Param('idPeriodo') id: number, @Query() paginationDto: PaginationDto) {
    return this.tarifasService.findAllByPeriodo(id, paginationDto, paginationDto.pagination);
  }
  
  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS LAS TARIFAS DE UN PERIODO
  @Get('actives/:idPeriodo')
  @ValidateJwtAuth()
  findAllActivesByPeriodo(@Param('idPeriodo') id: number, @Query() paginationDto: PaginationDto){
    return this.tarifasService.findAllActivesByPeriodo(id, paginationDto, paginationDto.pagination);
  }
  
  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS LAS TARIFAS DE UN PERIODO ACTIVO DE FACTURACION
  @Get('periodo-activo')
  @ValidateJwtAuth()
  findAllActivesByPeriodoActivo(@Query() paginationDto: PaginationDto){
    return this.tarifasService.findAllActivesByPeriodoActivo(paginationDto, paginationDto.pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.tarifasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateTarifaDto: UpdateTarifaDto) {
    return this.tarifasService.update(id, updateTarifaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.tarifasService.remove(id);
  }
}
