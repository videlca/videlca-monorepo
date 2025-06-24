import { Body, Controller, Get, Post, Param, Patch, ParseIntPipe, Query, Delete } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../../auth/decorators';
import { DescriptionRoutes } from '../../../auth/interfaces';

import { EstadoOrdenServicioService } from '../../services';
import { CreateTipoDto, UpdateEstadoOrdenDto, PaginationDto } from '../../dto';

@Controller('estado-orden')
@AppAuth(DescriptionRoutes.CONFIGURACION) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class EstadoOrdenController {

  constructor(private readonly estadoOrdenService: EstadoOrdenServicioService) {}
  
  // RUTA PROTEGIDA: Crear un estado orden de servicio
  @Post()
  create(@Body() createEstadoOrdenDto: CreateTipoDto) {
      return this.estadoOrdenService.create(createEstadoOrdenDto);
  }
  
  // RUTA PROTEGIDA: Obtener todos los estados orden
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.estadoOrdenService.findAll(paginationDto, paginationDto.pagination);
  }

  // OBTENER TODOS LOS ESTADOS ORDEN ACTIVOS
  @Get('actives')
  @ValidateJwtAuth()
  findAllActivas(@Query() paginationDto: PaginationDto) {
    return this.estadoOrdenService.findAllActives(paginationDto, paginationDto.pagination);
  }

  // OBTENER UN ESTADO ORDEN
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.estadoOrdenService.findOne(id);
  }

  // EDITAR UN ESTADO ORDEN
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateEstadoOrdenDto: UpdateEstadoOrdenDto) {
    return this.estadoOrdenService.update(id, updateEstadoOrdenDto);
  }

  // ELIMINAR UN ESTADO ORDEN
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.estadoOrdenService.remove(id);
  }

}
