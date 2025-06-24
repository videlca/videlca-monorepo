import { Body, Controller, Get, Post, Param, Patch, ParseIntPipe, Query, Delete } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { PaginationDto } from '../../common/dto';

import { TipoPersonalService } from '../services';
import { CreateTipoDto, UpdatetipoDto } from '../../common/dto';

@Controller('tipo-personal')
@AppAuth(DescriptionRoutes.CONFIGURACION) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class TipoPersonalController {

  constructor(private readonly tipoPersonalService: TipoPersonalService) {}
  
  // RUTA PROTEGIDA: Crear un tipo de personal
  @Post()
  create(@Body() createTipoPersonalDto: CreateTipoDto) {
      return this.tipoPersonalService.create(createTipoPersonalDto);
  }
  
  // RUTA PROTEGIDA: Obtener todos los tipos de personal
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.tipoPersonalService.findAll(paginationDto, paginationDto.pagination);
  }

  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS LOS TIPOS PERSONAL ACTIVOS
  @Get('actives')
  @ValidateJwtAuth()
  findAllActivas(@Query() paginationDto: PaginationDto) {
    return this.tipoPersonalService.findAllActives(paginationDto, paginationDto.pagination);
  }

  // OBTENER UN TIPO PERSONAL
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoPersonalService.findOne(id);
  }

  // EDITAR UN TIPO ID
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTipoPersonalDto: UpdatetipoDto) {
    return this.tipoPersonalService.update(id, updateTipoPersonalDto);
  }

  // ELIMINAR UN TIPO PERSONAL
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tipoPersonalService.remove(id);
  }

}
