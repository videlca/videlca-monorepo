import { Body, Controller, Get, Post, Param, Patch, ParseIntPipe, Query, Delete } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { PaginationDto } from '../../common/dto';

import { TipoUnidadTiempoService } from '../services';
import { CreateTipoUnidadTiempoDto, UpdateTipoUnidadTiempoDto } from '../dto';

@Controller('tipo-unidad-tiempo')
@AppAuth(DescriptionRoutes.TARIFAS) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class TipoUnidadTiempoController {

  constructor(private readonly tipoUnidadTiempoService: TipoUnidadTiempoService) {}
  
  // RUTA PROTEGIDA: Crear un tipo unidad tiempo
  @Post()
  create(@Body() createTipoUnidadTiempoDto: CreateTipoUnidadTiempoDto) {
      return this.tipoUnidadTiempoService.create(createTipoUnidadTiempoDto);
  }
  
  // RUTA PROTEGIDA: Obtener todos los tipos de unidad tiempo
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.tipoUnidadTiempoService.findAll(paginationDto, paginationDto.pagination);
  }

  // RUTA PROTEGIDA: OBTENER UN TIPO UNIDAD TIEMPO
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoUnidadTiempoService.findOne(id);
  }

  // RUTA PROTEGIDA: EDITAR UN TIPO UNIDAD TIEMPO
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTipoUnidadTiempoDto: UpdateTipoUnidadTiempoDto) {
    return this.tipoUnidadTiempoService.update(id, updateTipoUnidadTiempoDto);
  }

  // RUTA PROTEGIDA: ELIMINAR UN TIPO UNIDAD TIEMPO
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tipoUnidadTiempoService.remove(id);
  }

}
