import { Body, Controller, Get, Post, Param, Patch, ParseIntPipe, Query, Delete } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { PaginationDto } from '../../common/dto';

import { OrdenServicioIdService } from '../services';
import { AnularIdOrdenServicioDto, UpdateOrdenServicioIdDto } from '../dto';

@Controller('orden-servicio-id')
@AppAuth(DescriptionRoutes.ORDENES_SERVICIO) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class OrdenServicioIdController {

  constructor(private readonly ordenServicioIdService: OrdenServicioIdService) {}

  // RUTA PROTEGIDA: Obtener todos los orden servicio id
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.ordenServicioIdService.findAll(paginationDto, paginationDto.pagination);
  }
  
  // RUTA PROTEGIDA: ANULAR UN ORDEN SERVICIO ID
  @Post('anular-id')
  anularIdOrden(@Body() anularIdDto: AnularIdOrdenServicioDto){
    return this.ordenServicioIdService.anularId(anularIdDto);
  }

  // RUTA PROTEGIDA: OBTENER UN ORDEN SERVICIO ID
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordenServicioIdService.findOne(id);
  }


  // RUTA PROTEGIDA: EDITAR UN ORDEN SERVICIO ID
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateOrdenServicioIdDto: UpdateOrdenServicioIdDto) {
    return this.ordenServicioIdService.update(id, updateOrdenServicioIdDto);
  }

  // RUTA PROTEGIDA: ELIMINAR UN ORDEN SERVICIO ID
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ordenServicioIdService.remove(id);
  }

}
