import { Body, Controller, Get, Post, Param, Patch, ParseIntPipe, Query, Delete } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { PaginationDto } from '../../common/dto';

import { TipoGeneroService } from '../services';
import { CreateTipoDto, UpdatetipoDto } from '../../common/dto';

@Controller('tipo-genero')
@AppAuth(DescriptionRoutes.CONFIGURACION) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class TipoGeneroController {

  constructor(private readonly tipoGeneroService: TipoGeneroService) {}
  
  // RUTA PROTEGIDA: Crear un tipo de genero
  @Post()
  create(@Body() createTipoGeneroDto: CreateTipoDto) {
      return this.tipoGeneroService.create(createTipoGeneroDto);
  }
  
  // RUTA PROTEGIDA: Obtener todos los tipos de genero
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.tipoGeneroService.findAll(paginationDto, paginationDto.pagination);
  }

  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS LOS TIPOS GENERO ACTIVOS
  @Get('actives')
  @ValidateJwtAuth()
  findAllActivas(@Query() paginationDto: PaginationDto) {
    return this.tipoGeneroService.findAllActives(paginationDto, paginationDto.pagination);
  }

  // OBTENER UN TIPO GENERO
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoGeneroService.findOne(id);
  }

  // EDITAR UN TIPO GENERO
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTipoGeneroDto: UpdatetipoDto) {
    return this.tipoGeneroService.update(id, updateTipoGeneroDto);
  }

  // ELIMINAR UN TIPO GENERO
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tipoGeneroService.remove(id);
  }

}
