import { Body, Controller, Get, Post, Param, Patch, ParseIntPipe, Query, Delete } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../../auth/decorators';
import { DescriptionRoutes } from '../../../auth/interfaces';

import { EstadoOrdenServicioService } from '../../services';
import { CreateEstadoOrdenDto, UpdateEstadoOrdenDto, PaginationDto } from '../../dto';

@Controller('estado-orden')
@AppAuth(DescriptionRoutes.CONFIGURACION) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class EstadoOrdenController {

  constructor(private readonly estadoOrdenService: EstadoOrdenServicioService) {}
  
  @Post()
  create(@Body() createEstadoOrdenDto: CreateEstadoOrdenDto) {
      return this.estadoOrdenService.create(createEstadoOrdenDto);
  }
  
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.estadoOrdenService.findAll(paginationDto, paginationDto.pagination);
  }

  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS LOS ESTADOS ORDEN ACTIVOS
  @Get('actives')
  @ValidateJwtAuth()
  findAllActivas(@Query() paginationDto: PaginationDto) {
    return this.estadoOrdenService.findAllActives(paginationDto, paginationDto.pagination);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.estadoOrdenService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateEstadoOrdenDto: UpdateEstadoOrdenDto) {
    return this.estadoOrdenService.update(id, updateEstadoOrdenDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.estadoOrdenService.remove(id);
  }

}
