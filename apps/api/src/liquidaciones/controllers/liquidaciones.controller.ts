import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiQuery, ApiResponse } from '@nestjs/swagger';

import { AppAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { LiquidacionesService } from '../services/liquidaciones.service';
//import { GrupoLiquidacionesService } from '../services/grupoLiquidaciones.service';
import { CrearGrupoMensualDto } from '../dto/crearGrupoMensual.dto';
import { UpdateGrupoLiquidacionEstadoDto } from '../dto/updateGrupoLiquidacionEstado.dto';
import { FiltroGrupoLiquidacionDto } from '../dto/filtroGrupoLiquidacion.dto';

@ApiTags('liquidaciones')
@Controller('liquidaciones')
@AppAuth(DescriptionRoutes.LIQUIDACIONES) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class LiquidacionesController {
  constructor(
    private readonly service: LiquidacionesService,
    //    private readonly groupService: GrupoLiquidacionesService
  ) { }

  @Post('grupo/generar-mes')
  async generarGrupoMensual(@Body() dto: CrearGrupoMensualDto) {
    return this.service.generarGrupoMensual(dto);
  }


  @Get('ordenes-por-mes')
  async findByMes(
    @Query('anio', ParseIntPipe) anio: number,
    @Query('mes', ParseIntPipe) mes: number,
  ) {
    return this.service.findByCreacionMes(anio, mes);
  }

  @Get('/by-estado')
  async listByEstado(
    @Query('estado') estado: boolean,
  ) {
    return this.service.findByEstado(estado);
  }


  @Post(':id/liquidar-grupo')
  async confirmar(@Param('id', ParseIntPipe) id: number) {
    return this.service.liquidarGrupo(id);
  }

  @Delete(':id/desintegrar-grupo')
  async desintegrarGrupo(@Param('id', ParseIntPipe) id: number) {
    return this.service.desintegrarGrupo(id);
  }

  @Patch(':id/cambiar-estado')
  async actualizarCampoEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGrupoLiquidacionEstadoDto,
  ) {
    return this.service.actualizarCampoGrupoEstado(id, dto);
  }

  @Get('buscar-por-campo')
  async buscarPorCampoEstado(@Query() filtro: FiltroGrupoLiquidacionDto) {
    return this.service.findGruposPorCampoEstado(filtro.campo, filtro.valor);
  }

  @Get('buscar-grupos-liquidaciones')
  async buscarGrupoLiquidaciones() {
    return this.service.buscarGrupoLiquidaciones();
  }


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




}