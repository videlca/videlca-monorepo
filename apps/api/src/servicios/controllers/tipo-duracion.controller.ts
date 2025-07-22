import { Body, Controller, Get, Post, Param, Patch, ParseIntPipe, Query, Delete } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { TipoDuracionService } from '../services';
import { CreateTipoDto, UpdatetipoDto, PaginationDto } from '../../common/dto';

@Controller('tipo-duracion')
@AppAuth(DescriptionRoutes.SERVICIOS) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class TipoDuracionController {

  constructor(private readonly tipoDuracionService: TipoDuracionService) {}
  
  // RUTA PROTEGIDA: Crear un tipo duracion
  @Post()
  create(@Body() createTipoDuracionDto: CreateTipoDto) {
      return this.tipoDuracionService.create(createTipoDuracionDto);
  }
  
  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS LOS TIPOS DURACIONs
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.tipoDuracionService.findAll(paginationDto, paginationDto.pagination);
  }

  // RUTA PROTEGIDA: OBTENER UN TIPO DURACION
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoDuracionService.findOne(id);
  }

  // RUTA PROTEGIDA: EDITAR UN TIPO DURACION
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTipoDuracionDto: UpdatetipoDto) {
    return this.tipoDuracionService.update(id, updateTipoDuracionDto);
  }

  // RUTA PROTEGIDA: ELIMINAR UN TIPO DURACION
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tipoDuracionService.remove(id);
  }

}
