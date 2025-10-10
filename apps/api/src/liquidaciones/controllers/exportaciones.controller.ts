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
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGrupoLiquidacionEstadoDto,
  ) {
    return this.liquidacionesService.actualizarCampoGrupoEstado(id, dto);
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
  enviarReporte(
    @Param('idGrupoLiquidacion', ParseIntPipe) idGrupoLiquidacion: number,
    @Body() enviarCorreoDto: EnviarCorreoDto
  ) {
    // return this.liquidacionesService.sendConsolidacionExcel(idGrupoLiquidacion, enviarCorreoDto);
  }
  
  // @Get(':idGrupoLiquidacion/generar-excel-interfase')
  // async generarReporteInterfase(
  //   @Param('idGrupoLiquidacion', ParseIntPipe) idGrupoLiquidacion: number,
  //   @Res() res: Response
  // ) {

  //   const {excelBuffer, title} = await this.liquidacionesService.obtenerOrdenesPorCliente(idGrupoLiquidacion);

  //   res.setHeader(
  //     'Content-Type',
  //     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  //   );
  //   res.setHeader(
  //     'Content-Disposition',
  //     `attachment; filename=${title}.xlsx`,
  //   );

  //   res.end(excelBuffer);
  // }

  // @Get(':idGrupoLiquidacion/generar-pdf-anexo-facturacion')
  // async generarReporteAnexoFacturacion(
  //   @Param('idGrupoLiquidacion', ParseIntPipe) idGrupoLiquidacion: number,
  //   @Res() res: Response
  // ) {

  //   const {pdfDoc, title} = await this.liquidacionesService.obtenerOrdenesPorCliente(idGrupoLiquidacion);

  // }

}
