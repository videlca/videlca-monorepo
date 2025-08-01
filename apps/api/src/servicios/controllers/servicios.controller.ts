import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { PaginationDto } from '../../common/dto';

import { ServiciosService } from '../services';
import { CreateServicioDto, UpdateServicioDto } from '../dto';

@Controller('servicios')
@AppAuth(DescriptionRoutes.SERVICIOS) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class ServiciosController {

  constructor(private readonly serviciosService: ServiciosService) {}
  
  // RUTA PROTEGIDA: Crear un servicio
  @Post()
  create(@Body() createServicioDto: CreateServicioDto) {
    return this.serviciosService.create(createServicioDto);
  }
  
  // OBTENER TODOS LOS TIPOS SERVICIOS
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.serviciosService.findAll(paginationDto, paginationDto.pagination);
  }

  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS LOS SERVICIOS QUE NO TIENEN TARIFA EN EL PERIODO ESTABLECIDO
  @Get('periodo/:idPeriodo')
  @ValidateJwtAuth()
  findAllByPeriodo(@Param('idPeriodo') id: number, @Query() paginationDto: PaginationDto) {
    return this.serviciosService.findAllByPeriodo(id, paginationDto, paginationDto.pagination);
  }

  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS LOS SERVICIOS ACTIVOS
  @Get('actives')
  @ValidateJwtAuth()
  findAllActivos(@Query() paginationDto: PaginationDto) {
    return this.serviciosService.findAllActives(paginationDto, paginationDto.pagination);
  }

  @Get(':id')
  @ValidateJwtAuth()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviciosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateServicioDto: UpdateServicioDto) {
    return this.serviciosService.update(id, updateServicioDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviciosService.remove(id);
  }
}
