import { Controller, Get, Patch, Param, ParseIntPipe, Query, Res, Body, Post } from '@nestjs/common';
import type { Response } from 'express';

import { AppAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { EnviarCorreoDto } from '../../common/dto';

import { LiquidacionesService } from '../../liquidaciones/services/liquidaciones.service';
import { FiltroGrupoLiquidacionDto } from '../dto/filtroGrupoLiquidacion.dto';
import { UpdateGrupoLiquidacionEstadoDto } from '../dto/updateGrupoLiquidacionEstado.dto';

@Controller('exportacion')
// @AppAuth(DescriptionRoutes.EXPORTACIONES) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class ExportacionController {
  
  constructor(
    private liquidacionesService: LiquidacionesService
  ) {}

  @Get('buscar-por-campo')
  async buscarPorCampoEstado(@Query() filtro: FiltroGrupoLiquidacionDto) {
    return this.liquidacionesService.findGruposPorCampoEstado(filtro.campo, filtro.valor);
  }

  @Patch(':idGrupoLiquidacion/cambiar-estado')
  async actualizarCampoEstado(
    @Param('idGrupoLiquidacion', ParseIntPipe) idGrupoLiquidacion: number,
    @Body() updateGrupoLiquidacionEstadoDto: UpdateGrupoLiquidacionEstadoDto,
  ) {
    return this.liquidacionesService.actualizarCampoGrupoEstado(idGrupoLiquidacion, updateGrupoLiquidacionEstadoDto);
  }

  @Get(':idGrupoLiquidacion/generar-excel-consolidacion')
  async generarReporteConsolidacion(
    @Param('idGrupoLiquidacion', ParseIntPipe) idGrupoLiquidacion: number,
    @Res() res: Response
  ) {

    const {excelBuffer, title} = await this.liquidacionesService.downloadConsolidacionExcel(idGrupoLiquidacion);
  
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

  @Post(':idGrupoLiquidacion/enviar-excel-consolidacion')
  enviarReporteConsolidacion(
    @Param('idGrupoLiquidacion', ParseIntPipe) idGrupoLiquidacion: number,
    @Body() enviarCorreoDto: EnviarCorreoDto
  ) {
    return this.liquidacionesService.sendConsolidacionExcel(idGrupoLiquidacion, enviarCorreoDto);
  }
  
  @Get(':idGrupoLiquidacion/generar-excel-interfase')
  async generarReporteInterfase(
    @Param('idGrupoLiquidacion', ParseIntPipe) idGrupoLiquidacion: number,
    @Res() res: Response
  ) {

    const {excelBuffer, title} = await this.liquidacionesService.downloadInterfaseExcel(idGrupoLiquidacion);

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

  @Post(':idGrupoLiquidacion/enviar-excel-interfase')
  enviarReporteInterfase(
    @Param('idGrupoLiquidacion', ParseIntPipe) idGrupoLiquidacion: number,
    @Body() enviarCorreoDto: EnviarCorreoDto
  ) {
    return this.liquidacionesService.sendInterfaseExcel(idGrupoLiquidacion, enviarCorreoDto);
  }

  @Get(':idGrupoLiquidacion/generar-anexos-facturacion')
  async generarReporteAnexoFacturacion(
    @Param('idGrupoLiquidacion', ParseIntPipe) idGrupoLiquidacion: number,
    @Res() res: Response
  ) {

    const {zipBuffer, title} = await this.liquidacionesService.downloadAnexoZip(idGrupoLiquidacion);
  
    res.setHeader(
      'Content-Type',
      'application/zip',
    );
    
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${title}.zip`,
    );
  
    res.end(zipBuffer);

  }

  @Post(':idGrupoLiquidacion/enviar-anexos-facturacion')
  enviarReporteAnexoFacturacion(
    @Param('idGrupoLiquidacion', ParseIntPipe) idGrupoLiquidacion: number,
    @Body() enviarCorreoDto: EnviarCorreoDto
  ) {
    return this.liquidacionesService.sendAnexoZip(idGrupoLiquidacion, enviarCorreoDto);
  }

}
