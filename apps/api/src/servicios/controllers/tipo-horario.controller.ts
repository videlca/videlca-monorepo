import { Body, Controller, Get, Post, Param, Patch, ParseIntPipe, Query, Delete } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { PaginationDto } from '../../common/dto';

import { TipoHorarioService } from '../services';
import { CreateTipoHorarioDto, UpdateTipoHorarioDto } from '../dto';

@Controller('tipo-horario')
@AppAuth(DescriptionRoutes.SERVICIOS) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class TipoHorarioController {

  constructor(private readonly tipoHorarioService: TipoHorarioService) {}
  
  // RUTA PROTEGIDA: Crear un tipo horario
  @Post()
  create(@Body() createTipoHorarioDto: CreateTipoHorarioDto) {
      return this.tipoHorarioService.create(createTipoHorarioDto);
  }
  
  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS LOS TIPOS HORARIO
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.tipoHorarioService.findAll(paginationDto);
  }

  // RUTA PROTEGIDA: OBTENER UN TIPO HORARIO
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoHorarioService.findOne(id);
  }

  // RUTA PROTEGIDA: EDITAR UN TIPO HORARIO
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTipoHorarioDto: UpdateTipoHorarioDto) {
    return this.tipoHorarioService.update(id, updateTipoHorarioDto);
  }

  // RUTA PROTEGIDA: ELIMINAR UN TIPO HORARIO
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tipoHorarioService.remove(id);
  }

}
