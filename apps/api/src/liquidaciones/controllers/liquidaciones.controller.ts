import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiQuery, ApiResponse } from '@nestjs/swagger';

import { AppAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { LiquidacionesService } from '../services/liquidaciones.service';
//import { GrupoLiquidacionesService } from '../services/grupoLiquidaciones.service';
import { CrearGrupoMensualDto } from '../dto/crearGrupoMensual.dto';

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
    @Query('anio') anio: string,
    @Query('mes') mes: string,
  ) {
    const anioNum = parseInt(anio, 10);
    const mesNum = parseInt(mes, 10);

    if (isNaN(anioNum) || isNaN(mesNum)) {
      throw new BadRequestException('anio y mes deben ser numéricos');
    }

    return this.service.findByCreacionMes(anioNum, mesNum);
  }

    @Get('/by-estado')
  async listByEstado(
    @Query('estado') estado: boolean,
  ) {
    return this.service.findByEstado(estado);
  }


  @Post(':id/liquidarGrupo')
async confirmar(@Param('id', ParseIntPipe) id: number) {
  return this.service.liquidarGrupo(id);
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