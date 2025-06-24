import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { PaginationDto } from '../../common/dto';

import { ClientesService } from '../services';
import { CreateClienteDto, UpdateClienteDto } from '../dto';

@Controller('clientes')
@AppAuth(DescriptionRoutes.CLIENTE) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class ClientesController {

  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clientesService.create(createClienteDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.clientesService.findAll(paginationDto, paginationDto.pagination);
  }

  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS LOS CLIENTES ACTIVOS
  @Get('actives')
  @ValidateJwtAuth()
  findAllActivos(@Query() paginationDto: PaginationDto) {
    return this.clientesService.findAllActives(paginationDto, paginationDto.pagination);
  }

  @Get(':id')
  @ValidateJwtAuth()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateClienteDto: UpdateClienteDto) {
    return this.clientesService.update(id, updateClienteDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.remove(id);
  }
}
