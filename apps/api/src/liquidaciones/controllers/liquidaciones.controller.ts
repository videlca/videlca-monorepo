import { Controller, Get, Post, Body, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';

import { AppAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

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

  @Post('generar-mes')
  async generarGrupoMensual(@Body() crearGrupoMensualDto: CrearGrupoMensualDto) {
    return this.service.generarGrupoMensual(crearGrupoMensualDto);
  }

  @Get('ordenes-por-mes')
  async findByMes(
    @Query('anio', ParseIntPipe) anio: number,
    @Query('mes', ParseIntPipe) mes: number,
  ) {
    return this.service.findByCreacionMes(anio, mes);
  }

  @Get('historial-liquidaciones-aprobadas')
  async findByMesLiquidacionesAprobadas(
    @Query('anio', ParseIntPipe) anio: number,
    @Query('mes', ParseIntPipe) mes: number,
  ) {
    return this.service.findByMesLiquidacionesAprobadas(anio, mes);
  }

  // @Get('by-estado')
  // async listByEstado(
  //   @Query('estado') estado: boolean,
  // ) {
  //   return this.service.findByEstado(estado);
  // }

}
