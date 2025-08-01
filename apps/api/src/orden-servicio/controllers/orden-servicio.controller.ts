import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';

import { AppAuth, GetUser, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { PaginationDto } from '../../common/dto';

import { User } from '../../users/entities/user.entity';

import { OrdenServicioService } from '../services/orden-servicio.service';

import { CreateOrdenServicioDto, TercerPasoDto, PrecioOrdenDto } from '../dto';

@Controller('orden-servicio')
@AppAuth(DescriptionRoutes.ORDENES_SERVICIO) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class OrdenServicioController {
  constructor(private readonly ordenServicioService: OrdenServicioService) {}

  @Post()
  create(
    @Body() createOrdenServicioDto: CreateOrdenServicioDto,
    @GetUser() user: User
  ) {
    return this.ordenServicioService.create(createOrdenServicioDto, user);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.ordenServicioService.findAll(paginationDto, paginationDto.pagination);
  }

  @Post('validacion-horarios')
  validacionHorarios(@Body() tercerPasoDto: TercerPasoDto) {
    return this.ordenServicioService.validacionHorarios(tercerPasoDto);
  }

  @Post('obtener-precio')
  obtenerPrecioOrden(@Body() obtenerPrecioOrdenDto: PrecioOrdenDto){
    return this.ordenServicioService.obtenerPrecio(obtenerPrecioOrdenDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordenServicioService.findOne(id);
  }

  // @Patch(':id')
  // update(@Param('id', ParseIntPipe) id: number, @Body() updateOrdenServicioDto: UpdateOrdenServicioDto) {
  //   return this.ordenServicioService.update(id, updateOrdenServicioDto);
  // }

  // @Delete(':id')
  // remove(@Param('id', ParseIntPipe) id: number) {
  //   return this.ordenServicioService.remove(id);
  // }

}
