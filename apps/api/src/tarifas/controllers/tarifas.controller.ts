import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, Res } from '@nestjs/common';
import type { Response } from 'express';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { EnviarCorreoDto, PaginationDto } from '../../common/dto';

import { TarifasService } from '../services/tarifas.service';
import { CreateTarifaDto, UpdateTarifaDto, SaveTarifaDto } from '../dto';

@Controller('tarifas')
@AppAuth(DescriptionRoutes.TARIFAS) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class TarifasController {
  constructor(private readonly tarifasService: TarifasService) {}
  
  // RUTA PROTEGIDA: Crear tarifa para un periodo
  @Post()
  create(@Body() createTarifaDto: CreateTarifaDto) {
    return this.tarifasService.create(createTarifaDto);
  }
  
  // RUTA PROTEGIDA (para ver desde otra pantalla o dropdown): OBTENER TODOS LAS TARIFAS DE UN PERIODO
  @Get('periodo/:idPeriodo')
  findAllByPeriodo(@Param('idPeriodo', ParseIntPipe) id: number) {
    return this.tarifasService.findAllByPeriodo(id);
  }
  
  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS LAS TARIFAS DE UN PERIODO
  @Get('actives/:idPeriodo')
  @ValidateJwtAuth()
  findAllActivesByPeriodo(@Param('idPeriodo', ParseIntPipe) id: number, @Query() paginationDto: PaginationDto){
    return this.tarifasService.findAllActivesByPeriodo(id, paginationDto);
  }

  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS LAS TARIFAS DE UN PERIODO ACTIVO DE FACTURACION FILTRADAS POR SU TIPO DE SERVICIO
  @Get('periodo-activo-facturacion/:idTipoServicio')
  @ValidateJwtAuth()
  findAllActivesByPeriodoActivoTipoServicio(@Param('idTipoServicio', ParseIntPipe) idTipoServicio: number, @Query() paginationDto: PaginationDto){
    return this.tarifasService.findAllActivesByPeriodoActivoTipoServicio(idTipoServicio, paginationDto);
  }

  // RUTA PROTEGIDA: guardar tarifas para un periodo
  @Post('guardar-tarifas')
  bulk(@Body() bulkCreateTarifaDto: SaveTarifaDto) {
    return this.tarifasService.bulkCreate(bulkCreateTarifaDto);
  }
  
  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS LAS TARIFAS DE UN PERIODO ACTIVO DE FACTURACION
  @Get('periodo-activo')
  @ValidateJwtAuth()
  findAllActivesByPeriodoActivo(@Query() paginationDto: PaginationDto){
    return this.tarifasService.findAllActivesByPeriodoActivo(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tarifasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTarifaDto: UpdateTarifaDto) {
    return this.tarifasService.update(id, updateTarifaDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tarifasService.remove(id);
  }

  @Get(':periodoId/generar-excel')
  async generarReporte(
    @Param('periodoId', ParseIntPipe) periodoId: number,
    @Res() res: Response
  ) {
    
    const {excelBuffer, title} = await this.tarifasService.downloadTarifasPeriodoExcel(periodoId);

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

  @Post(':periodoId/enviar-excel')
  enviarReporte(
    @Param('periodoId', ParseIntPipe) periodoId: number,
    @Body() enviarCorreoDto: EnviarCorreoDto
  ) {
    return this.tarifasService.sendTarifasPeriodoExcel(periodoId, enviarCorreoDto);
  }
}
