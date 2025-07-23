import { Body, Controller, Get, Post, Param, Patch, ParseIntPipe, Query, Delete } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { PaginationDto } from '../../common/dto';

import { TipoServicioService } from '../services';
import { CreateTipoServicioDto, UpdateTipoServicioDto } from '../dto';

@Controller('tipo-servicio')
@AppAuth(DescriptionRoutes.SERVICIOS) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class TipoServicioController {

  constructor(private readonly tipoServicioService: TipoServicioService) {}
  
  // RUTA PROTEGIDA: Crear un tipo servicio
  @Post()
  create(@Body() createTipoServicioDto: CreateTipoServicioDto) {
      return this.tipoServicioService.create(createTipoServicioDto);
  }
  
  // RUTA PROTEGIDA: Obtener todos los tipos de servicio
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.tipoServicioService.findAll(paginationDto, paginationDto.pagination);
  }

  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS LOS TIPOS SERVICIO
  @Get('actives')
  @ValidateJwtAuth()
  findAllActivas(@Query() paginationDto: PaginationDto) {
    return this.tipoServicioService.findAllActives(paginationDto, paginationDto.pagination);
  }

  // RUTA PROTEGIDA: OBTENER UN TIPO SERVICIO
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoServicioService.findOne(id);
  }

  // RUTA PROTEGIDA: EDITAR UN TIPO SERVICIO
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTipoServicioDto: UpdateTipoServicioDto) {
    return this.tipoServicioService.update(id, updateTipoServicioDto);
  }

  // RUTA PROTEGIDA: ELIMINAR UN TIPO SERVICIO
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tipoServicioService.remove(id);
  }

}
