import { Controller, Get, Param, ParseIntPipe, Query, Res } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';

import { AppAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { LiquidacionesService } from '../../liquidaciones/services/liquidaciones.service';
import { FiltroGrupoLiquidacionDto } from '../dto/filtroGrupoLiquidacion.dto';

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
