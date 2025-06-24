import { Body, Controller, Get, Post, Param, Patch, ParseIntPipe, Query, Delete } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../../auth/decorators';
import { DescriptionRoutes } from '../../../auth/interfaces';

import { TipoClienteService } from '../../services';
import { CreateTipoDto, UpdatetipoDto, PaginationDto } from '../../dto';

@Controller('tipo-cliente')
@AppAuth(DescriptionRoutes.CONFIGURACION) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class TipoClienteController {

  constructor(private readonly tipoClienteService: TipoClienteService) {}
  
  // RUTA PROTEGIDA: Crear un tipo cliente
  @Post()
  create(@Body() createTipoClienteDto: CreateTipoDto) {
      return this.tipoClienteService.create(createTipoClienteDto);
  }
  
  // RUTA PUBLICA: Obtener todos los tipos de cliente
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.tipoClienteService.findAll(paginationDto, paginationDto.pagination);
  }

  // OBTENER TODOS LOS TIPOS CLIENTE ACTIVOS
  @Get('actives')
  @ValidateJwtAuth()
  findAllActivas(@Query() paginationDto: PaginationDto) {
    return this.tipoClienteService.findAllActives(paginationDto, paginationDto.pagination);
  }

  // OBTENER UN TIPO CLIENTE
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoClienteService.findOne(id);
  }

  // EDITAR UN TIPO CLIENTE
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTipoClienteDto: UpdatetipoDto) {
    return this.tipoClienteService.update(id, updateTipoClienteDto);
  }

  // ELIMINAR UN TIPO CLIENTE
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tipoClienteService.remove(id);
  }

}
