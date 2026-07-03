import { Body, Controller, Get, Post, Param, Patch, ParseIntPipe, Query, Delete } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { PaginationDto, CreateTipoDto, UpdatetipoDto } from '../../common/dto';

import { TipoNovedadService } from '../services';

@Controller('tipo-novedad')
@AppAuth(DescriptionRoutes.CONFIGURACION) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class TipoNovedadController {

  constructor(private readonly tipoNovedadService: TipoNovedadService) {}
  
  // RUTA PROTEGIDA: Crear un tipo de novedad personal
  @Post()
  create(@Body() createTipoNovedadDto: CreateTipoDto) {
      return this.tipoNovedadService.create(createTipoNovedadDto);
  }
  
  // RUTA PROTEGIDA: Obtener todos los tipos de novedad
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.tipoNovedadService.findAll(paginationDto);
  }

  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS LOS TIPOS NOVEDAD ACTIVOS
  @Get('actives')
  @ValidateJwtAuth()
  findAllActivas(@Query() paginationDto: PaginationDto) {
    return this.tipoNovedadService.findAllActives(paginationDto);
  }

  // OBTENER UN TIPO NOVEDAD
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoNovedadService.findOne(id);
  }

  // EDITAR UN TIPO NOVEDAD
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTipoNovedadDto: UpdatetipoDto) {
    return this.tipoNovedadService.update(id, updateTipoNovedadDto);
  }

  // ELIMINAR UN TIPO NOVEDAD
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tipoNovedadService.remove(id);
  }

}
