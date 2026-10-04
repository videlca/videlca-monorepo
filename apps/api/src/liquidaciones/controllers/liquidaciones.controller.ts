import { Controller, Get, Post, Body, Query, ParseIntPipe, DefaultValuePipe, Param, Res } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { EnviarCorreoDto } from '../../common/dto';

import { CrearGrupoMensualDto } from '../dto/crearGrupoMensual.dto';
import { LiquidacionesService } from '../services/liquidaciones.service';

@ApiTags('liquidaciones')
@Controller('liquidaciones')
@AppAuth(DescriptionRoutes.LIQUIDACIONES) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class LiquidacionesController {
  constructor(
    private readonly service: LiquidacionesService,
  ) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'ordenId', required: false, example: 10, description: 'Filtra por idOrdenServicio' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('ordenId') ordenId?: string, // lo convertimos si viene
  ) {
    const oid = ordenId ? Number(ordenId) : undefined;
    return this.service.findAll({ page, limit, ordenId: oid });
  }

  @Get(':idLiquidacion/orden')
  findOrdenLiquidada(
    @Param('idLiquidacion', ParseIntPipe) idLiquidacion: number,
  ) {
    return this.service.findOrdenLiquidada(idLiquidacion);
  }

  @Post('generar-mes')
  async generarGrupoMensual(@Body() crearGrupoMensualDto: CrearGrupoMensualDto) {
    return this.service.generarGrupoMensual(crearGrupoMensualDto);
  }

  @Get('ordenes-por-mes')
  @ApiQuery({ name: 'mesesAtras', required: false, example: 1, description: 'Cuantos meses anteriores al solicitado se buscan tambien con ordenes pendientes por liquidar (0 a 12, por defecto 1)' })
  async findByMes(
    @Query('anio', ParseIntPipe) anio: number,
    @Query('mes', ParseIntPipe) mes: number,
    @Query('mesesAtras', new DefaultValuePipe(1), ParseIntPipe) mesesAtras: number,
  ) {
    return this.service.findByCreacionMes(anio, mes, mesesAtras);
  }

  @Get('adicionales-por-mes')
  @ApiQuery({ name: 'mesesAtras', required: false, example: 1, description: 'Cuantos meses anteriores al solicitado se buscan tambien con adicionales pendientes por liquidar (0 a 12, por defecto 1)' })
  async findAdicionalesByMes(
    @Query('anio', ParseIntPipe) anio: number,
    @Query('mes', ParseIntPipe) mes: number,
    @Query('mesesAtras', new DefaultValuePipe(1), ParseIntPipe) mesesAtras: number,
  ) {
    return this.service.findAdicionalesByCreacionMes(anio, mes, mesesAtras);
  }

  @Get('historial-liquidaciones-aprobadas')
  @ApiQuery({ name: 'idCliente', required: false, example: 37, description: 'Filtra por el cliente del grupo de liquidación' })
  @ApiQuery({ name: 'tiposServicio', required: false, example: 'monitoreo,vigilancia', description: 'Tipos de servicio separados por coma: "monitoreo" y/o "vigilancia" (vigilancia incluye los adicionales). Sin este parametro se devuelven los dos' })
  async findByMesLiquidacionesAprobadas(
    @Query('anio', ParseIntPipe) anio: number,
    @Query('mes', ParseIntPipe) mes: number,
    @Query('idCliente', new ParseIntPipe({ optional: true })) idCliente?: number,
    @Query('tiposServicio') tiposServicio?: string,
  ) {
    return this.service.findByMesLiquidacionesAprobadas(anio, mes, idCliente, tiposServicio?.split(','));
  }

  // COMPARA LAS LIQUIDACIONES APROBADAS DE UN CLIENTE ENTRE DOS MESES (diferencia = B - A)
  @Get('comparar-cliente')
  @ApiQuery({ name: 'idCliente', required: true, example: 37 })
  @ApiQuery({ name: 'anioA', required: true, example: 2026 })
  @ApiQuery({ name: 'mesA', required: true, example: 8 })
  @ApiQuery({ name: 'anioB', required: true, example: 2026 })
  @ApiQuery({ name: 'mesB', required: true, example: 9 })
  @ApiQuery({ name: 'tiposServicio', required: true, example: 'monitoreo,vigilancia', description: 'Tipos de servicio a comparar separados por coma, al menos uno: "monitoreo" y/o "vigilancia" (vigilancia incluye los adicionales)' })
  async compararLiquidacionesCliente(
    @Query('idCliente', ParseIntPipe) idCliente: number,
    @Query('anioA', ParseIntPipe) anioA: number,
    @Query('mesA', ParseIntPipe) mesA: number,
    @Query('anioB', ParseIntPipe) anioB: number,
    @Query('mesB', ParseIntPipe) mesB: number,
    @Query('tiposServicio') tiposServicio?: string,
  ) {
    return this.service.compararLiquidacionesCliente(idCliente, anioA, mesA, anioB, mesB, (tiposServicio ?? '').split(','));
  }

  @Get(':idGrupoLiquidacion/generar-excel-liquidacion')
  @ValidateJwtAuth()
  async generarReporteLiquidacion(
    @Param('idGrupoLiquidacion', ParseIntPipe) idGrupoLiquidacion: number,
    @Res() res: Response
  ) {
      
    const {excelBuffer, title} = await this.service.downloadLiquidacionExcel(idGrupoLiquidacion);
  
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

  @Post(':idGrupoLiquidacion/enviar-excel-liquidacion')
  @ValidateJwtAuth()
  enviarReporteLiquidacion(
    @Param('idGrupoLiquidacion', ParseIntPipe) idGrupoLiquidacion: number,
    @Body() enviarCorreoDto: EnviarCorreoDto
  ) {

    return this.service.sendLiquidacionExcel(idGrupoLiquidacion, enviarCorreoDto);

  }

  // PDF DEL GRUPO DE LIQUIDACION (la "factura" del cliente): mismo estilo que el PDF de la orden de servicio
  @Get(':idGrupoLiquidacion/generar-pdf-liquidacion')
  @ValidateJwtAuth()
  async generarPdfGrupoLiquidacion(
    @Param('idGrupoLiquidacion', ParseIntPipe) idGrupoLiquidacion: number,
    @Res() res: Response
  ) {

    const { pdfDoc, title } = await this.service.downloadGrupoLiquidacionPdf(idGrupoLiquidacion);

    pdfDoc.info.Title = title;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${title}.pdf"`,
    );

    pdfDoc.pipe(res);
    pdfDoc.end();

  }

  @Post(':idGrupoLiquidacion/enviar-pdf-liquidacion')
  @ValidateJwtAuth()
  enviarPdfGrupoLiquidacion(
    @Param('idGrupoLiquidacion', ParseIntPipe) idGrupoLiquidacion: number,
    @Body() enviarCorreoDto: EnviarCorreoDto
  ) {

    return this.service.sendGrupoLiquidacionPdf(idGrupoLiquidacion, enviarCorreoDto);

  }

  // @Get('by-estado')
  // async listByEstado(
  //   @Query('estado') estado: boolean,
  // ) {
  //   return this.service.findByEstado(estado);
  // }

}
