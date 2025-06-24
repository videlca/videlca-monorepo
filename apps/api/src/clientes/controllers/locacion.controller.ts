import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { PaginationDto } from '../../common/dto';

import { LocacionService } from '../services';
import { CreateLocacionDto, UpdateLocacionDto } from '../dto';

@Controller('locaciones')
@AppAuth(DescriptionRoutes.CLIENTE) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class LocacionController {
  
    constructor(private readonly locacionService: LocacionService) {}

    @Post()
    create(@Body() createLocacionDto: CreateLocacionDto) {
        return this.locacionService.create(createLocacionDto);
    }

    // RUTA PROTEGIDA: Obtener todas las locaciones
    @Get()
    findAll(@Query() paginationDto: PaginationDto) {
        return this.locacionService.findAll(paginationDto, paginationDto.pagination);
    }

    // OBTENER TODAS LAS LOCACIONES ACTIVAS
    @Get('actives')
    @ValidateJwtAuth()
    findAllActivas(@Query() paginationDto: PaginationDto) {
        return this.locacionService.findAllActives(paginationDto, paginationDto.pagination);
    }

    @Get('cliente/:idCliente')
    findByCliente(@Param('idCliente', ParseIntPipe) idCliente: number) {
        return this.locacionService.findByCliente(idCliente);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.locacionService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number, 
        @Body() updateLocacionDto: UpdateLocacionDto
    ) {
        return this.locacionService.update(id, updateLocacionDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.locacionService.remove(id);
    }

}