import { Body, Controller, Get, Post, Param, Patch, ParseIntPipe, Query, Delete } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../../auth/decorators';
import { DescriptionRoutes } from '../../../auth/interfaces';

import { TipoIdentificacionService } from '../../services';
import { CreateTipoDto, UpdatetipoDto, PaginationDto } from '../../dto';

@Controller('tipo-id')
@AppAuth(DescriptionRoutes.CONFIGURACION) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class TipoIdentificacionController {

  constructor(private readonly tipoIdentificacionService: TipoIdentificacionService) {}
  
  // RUTA PROTEGIDA: Crear un tipo id
  @Post()
  create(@Body() createTipoIdDto: CreateTipoDto) {
      return this.tipoIdentificacionService.create(createTipoIdDto);
  }
  
  // RUTA PROTEGIDA: Obtener todos los tipos de id
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.tipoIdentificacionService.findAll(paginationDto, paginationDto.pagination);
  }

  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS LOS TIPOS ID
  @Get('actives')
  @ValidateJwtAuth()
  findAllActivas(@Query() paginationDto: PaginationDto) {
    return this.tipoIdentificacionService.findAllActives(paginationDto, paginationDto.pagination);
  }

  // RUTA PROTEGIDA: OBTENER UN TIPO ID
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoIdentificacionService.findOne(id);
  }

  // RUTA PROTEGIDA: EDITAR UN TIPO ID
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTipoIdDto: UpdatetipoDto) {
    return this.tipoIdentificacionService.update(id, updateTipoIdDto);
  }

  // RUTA PROTEGIDA: ELIMINAR UN TIPO ID
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tipoIdentificacionService.remove(id);
  }

}
