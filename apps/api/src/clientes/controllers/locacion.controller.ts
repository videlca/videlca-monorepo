import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { PaginationDto } from '../../common/dto';

import { LocacionService } from '../services';
import { CreateLocacionDto, UpdateLocacionDto, LocacionSearchDto } from '../dto';

@Controller('locaciones')
@AppAuth(DescriptionRoutes.CLIENTE) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class LocacionController {
  
    constructor(private readonly locacionService: LocacionService) {}

    @Post()
    create(@Body() createLocacionDto: CreateLocacionDto) {
        return this.locacionService.create(createLocacionDto);
    }

    @Get()
    findAll(@Query() paginationDto: PaginationDto) {
        return this.locacionService.findAll(paginationDto);
    }

    // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODAS LAS LOCACIONES ACTIVAS
    @Get('actives')
    @ValidateJwtAuth()
    findAllActivas(@Query() paginationDto: PaginationDto) {
        return this.locacionService.findAllActives(paginationDto);
    }
    
    // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODAS LAS LOCACIONES POR BUSQUEDA DE TEXTO
    @Get('search')
    @ValidateJwtAuth()
    findAllActivasSeacrh(@Query() locacionSearch: LocacionSearchDto) {
        return this.locacionService.findAllActivesSearch(locacionSearch);
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