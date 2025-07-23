import { Body, Controller, Get, Post, Param, Patch, ParseIntPipe, Query, Delete } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { TipoHorarioDescripcionService } from '../services';
import { CreateTipoDto, UpdatetipoDto, PaginationDto } from '../../common/dto';

@Controller('tipo-horario-descripcion')
@AppAuth(DescriptionRoutes.SERVICIOS) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class TipoHorarioDescripcionController {

  constructor(private readonly tipoHorarioDescripcionService: TipoHorarioDescripcionService) {}
  
  // RUTA PROTEGIDA: Crear un tipo horario descripcion
  @Post()
  create(@Body() createTipoHorarioDescripcionDto: CreateTipoDto) {
      return this.tipoHorarioDescripcionService.create(createTipoHorarioDescripcionDto);
  }
  
  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS LOS TIPOS HORARIO DESCRIPCION
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.tipoHorarioDescripcionService.findAll(paginationDto, paginationDto.pagination);
  }

  // RUTA PROTEGIDA: OBTENER UN TIPO HORARIO DESCRIPCION
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoHorarioDescripcionService.findOne(id);
  }

  // RUTA PROTEGIDA: EDITAR UN TIPO HORARIO DESCRIPCION
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTipoHorarioDescripcionDto: UpdatetipoDto) {
    return this.tipoHorarioDescripcionService.update(id, updateTipoHorarioDescripcionDto);
  }

  // RUTA PROTEGIDA: ELIMINAR UN TIPO HORARIO DESCRIPCION
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tipoHorarioDescripcionService.remove(id);
  }

}
