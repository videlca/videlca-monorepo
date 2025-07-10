import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { UpdatetipoDto } from '../../common/dto';

import { SubSegmentacionService } from '../services';
import { QuerySubSegmentacionesWithPaginationDto } from '../dto';

@Controller('subsegmentaciones')
@AppAuth(DescriptionRoutes.CLIENTE) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class SubSegmentacionController {

    constructor(private readonly subSegmentacionService: SubSegmentacionService) {}

    // 9. GET /subsegmentaciones - Listar subsegmentaciones (con filtros)
    @Get()
    findAll(@Query() query: QuerySubSegmentacionesWithPaginationDto) {
        return this.subSegmentacionService.findAll(query);
    }
    
    // 10. GET /subsegmentaciones/:id - Obtener subsegmentación específica
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.subSegmentacionService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number, 
        @Body() updateSubSegmentacionDto: UpdatetipoDto
    ) {
        return this.subSegmentacionService.update(id, updateSubSegmentacionDto);
    }

    @Delete(':id')
    remove(
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.subSegmentacionService.remove(id);
    }

}