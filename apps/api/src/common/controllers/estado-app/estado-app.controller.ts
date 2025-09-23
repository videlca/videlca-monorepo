import { Body, Controller, Get, Post, Param, Patch, ParseIntPipe, Query, Delete } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../../auth/decorators';
import { DescriptionRoutes } from '../../../auth/interfaces';

import { EstadoAppService } from '../../services';
import { CreateEstadoAppDto, UpdateEstadoAppDto, PaginationDto } from '../../dto';

@Controller('estado-app')
@AppAuth(DescriptionRoutes.CONFIGURACION) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class EstadoAppController {

  constructor(private readonly estadoAppService: EstadoAppService) {}
  
  @Post()
  create(@Body() createEstadoAppDto: CreateEstadoAppDto) {
      return this.estadoAppService.create(createEstadoAppDto);
  }
  
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.estadoAppService.findAll(paginationDto, paginationDto.pagination);
  }

  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS LOS ESTADOS APP ACTIVOS
  @Get('actives')
  @ValidateJwtAuth()
  findAllActivas(@Query() paginationDto: PaginationDto) {
    return this.estadoAppService.findAllActives(paginationDto, paginationDto.pagination);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.estadoAppService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateEstadoAppDto: UpdateEstadoAppDto) {
    return this.estadoAppService.update(id, updateEstadoAppDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.estadoAppService.remove(id);
  }

}
