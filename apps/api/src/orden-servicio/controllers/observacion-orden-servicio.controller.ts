import { Body, Controller, Get, Post, Param, Patch, ParseIntPipe, Query, Delete } from '@nestjs/common';

import { AppAuth, GetUser, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { User } from '../../users/entities/user.entity';

import { PaginationDto } from '../../common/dto';

import { ObservacionesOrdenServicioService } from '../services';
import { CreateObservacionOrdenServicioDto, UpdateObservacionOrdenServicioDto } from '../dto';

@Controller('observaciones-orden-servicio')
@AppAuth(DescriptionRoutes.ORDENES_SERVICIO) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class ObservacionesOrdenServicioController {

  constructor(private readonly observacionesOrdenServicioService: ObservacionesOrdenServicioService) {}
  
    // RUTA PROTEGIDA: Crear una observacion a una orden de servicio
    @Post()
    create(
        @Body() createObservacionOrdenServicioDto: CreateObservacionOrdenServicioDto,
        @GetUser() user: User
    ) {
        return this.observacionesOrdenServicioService.create(createObservacionOrdenServicioDto, user);
    }

    // RUTA PROTEGIDA: Obtener todas las observaciones de una orden de servicio
    @Get('obtener-comentarios/:idOrdenServicio')
    findAllObservacionesOrden(
        @Param('idOrdenServicio', ParseIntPipe) id: number,
        @Query() paginationDto: PaginationDto
    ) {
        return this.observacionesOrdenServicioService.findAll(id, paginationDto, paginationDto.pagination);
    }

    // RUTA PROTEGIDA: OBTENER UNA OBSERVACION
    @Get(':idObservacionOrdenServicio')
    findOne(@Param('idObservacionOrdenServicio', ParseIntPipe) id: number) {
        return this.observacionesOrdenServicioService.findOne(id);
    }

    // RUTA PROTEGIDA: EDITAR UNA OBSERVACION
    @Patch(':idObservacionOrdenServicio')
    update(
        @Param('idObservacionOrdenServicio', ParseIntPipe) id: number, 
        @Body() updateObservacionOrdenServicioDto: UpdateObservacionOrdenServicioDto,
        @GetUser() user: User
    ) {
        return this.observacionesOrdenServicioService.update(id, updateObservacionOrdenServicioDto, user);
    }

    // RUTA PROTEGIDA: ELIMINAR UNA OBSERVACION
    @Delete(':idObservacionOrdenServicio')
    remove(
        @Param('idObservacionOrdenServicio', ParseIntPipe) id: number,
        @GetUser() user: User
    ) {
        return this.observacionesOrdenServicioService.remove(id, user);
    }

}
