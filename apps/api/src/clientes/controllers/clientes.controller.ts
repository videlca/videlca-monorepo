import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Res, ParseIntPipe } from '@nestjs/common';
import type { Response } from 'express';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { PaginationDto, EnviarCorreoDto } from '../../common/dto';

import { ClientesService } from '../services';
import { CreateClienteDto, UpdateClienteDto, FilterClienteDto } from '../dto';

@Controller('clientes')
// @AppAuth(DescriptionRoutes.CLIENTE) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class ClientesController {

  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clientesService.create(createClienteDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    console.log('paginationDto', paginationDto);

    return this.clientesService.findAll(paginationDto);
  }

  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS LOS CLIENTES ACTIVOS
  @Get('actives')
  @ValidateJwtAuth()
  findAllActivos(@Query() paginationDto: PaginationDto) {
    
    return this.clientesService.findAllActives(paginationDto);
  }

  @Get('descargar-clientes')
  async generarReporteClientes(
    @Res() res: Response
  ) {
      
    const {excelBuffer, title} = await this.clientesService.downloadClientes();
  
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${title}.xlsx`,
    );
  
    res.end(excelBuffer);

  }

  @Post('enviar-excel-clientes')
  enviarReporteLiquidacion(
    @Body() enviarCorreoDto: EnviarCorreoDto
  ) {

    return this.clientesService.sendClientesExcel(enviarCorreoDto);

  }

  @Get('filter')
  findFiltered(@Query() filterClienteDto: FilterClienteDto) {
    return this.clientesService.findFiltered(
      filterClienteDto
    );
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
