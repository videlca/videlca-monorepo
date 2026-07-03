import { Body, Controller, Get, Post, Param, Patch, ParseIntPipe, Query, Delete } from '@nestjs/common';

import { AppAuth, GetUser, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { User } from '../../users/entities/user.entity';

import { PaginationDto } from '../../common/dto';

import { ObservacionesGrupoOrdenServicioService } from '../services/observacion-grupo-orden-servicio.service';
import { CreateObservacionGrupoOrdenServicioDto, UpdateObservacionGrupoOrdenServicioDto } from '../dto';

@Controller('observaciones-grupo-orden-servicio')
@AppAuth(DescriptionRoutes.LIQUIDACIONES)// RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class ObservacionesGrupoOrdenServicioController {

  constructor(private readonly observacionesGrupoOrdenServicioService: ObservacionesGrupoOrdenServicioService) {}
  
    // RUTA PROTEGIDA: Crear una observacion a un grupo de orden de servicio
    @Post()
    create(
        @Body() createObservacionGrupoOrdenServicioDto: CreateObservacionGrupoOrdenServicioDto,
        @GetUser() user: User
    ) {
        return this.observacionesGrupoOrdenServicioService.create(createObservacionGrupoOrdenServicioDto, user);
    }

    // RUTA PROTEGIDA: Obtener todas las observaciones de un grupo de orden de servicio
    @Get('obtener-comentarios/:idGrupoOrdenServicio')
    findAllObservacionesGrupoOrden(
        @Param('idGrupoOrdenServicio', ParseIntPipe) id: number,
        @Query() paginationDto: PaginationDto
    ) {
        return this.observacionesGrupoOrdenServicioService.findAll(id, paginationDto);
    }

    // RUTA PROTEGIDA: OBTENER UNA OBSERVACION
    @Get(':idObservacionGrupoOrdenServicio')
    findOne(@Param('idObservacionGrupoOrdenServicio', ParseIntPipe) id: number) {
        return this.observacionesGrupoOrdenServicioService.findOne(id);
    }

    // RUTA PROTEGIDA: EDITAR UNA OBSERVACION
    @Patch(':idObservacionGrupoOrdenServicio')
    update(
        @Param('idObservacionGrupoOrdenServicio', ParseIntPipe) id: number, 
        @Body() updateObservacionGrupoOrdenServicioDto: UpdateObservacionGrupoOrdenServicioDto,
        @GetUser() user: User
    ) {
        return this.observacionesGrupoOrdenServicioService.update(id, updateObservacionGrupoOrdenServicioDto, user);
    }

    // RUTA PROTEGIDA: ELIMINAR UNA OBSERVACION
    @Delete(':idObservacionGrupoOrdenServicio')
    remove(
        @Param('idObservacionGrupoOrdenServicio', ParseIntPipe) id: number,
        @GetUser() user: User
    ) {
        return this.observacionesGrupoOrdenServicioService.remove(id, user);
    }

}
