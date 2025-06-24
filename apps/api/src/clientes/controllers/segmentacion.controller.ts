import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';


import { CreateTipoDto, UpdatetipoDto } from '../../common/dto';

import { SegmentacionService } from '../services';
import { CreateSegmentacionDto, UpdateSegmentacionDto, QuerySegmentacionesWithPaginationDto } from '../dto';

@Controller('segmentaciones')
@AppAuth(DescriptionRoutes.CLIENTE) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class SegmentacionController {
  constructor(private readonly segmentacionService: SegmentacionService) {}

  // 1. POST /segmentaciones - Crear segmentación (con o sin subsegmentaciones)
  @Post()
  create(@Body() createSegmentacionDto: CreateSegmentacionDto) {
    return this.segmentacionService.create(createSegmentacionDto);
  }

  // 2. GET /segmentaciones - Listar todas las segmentaciones
  @Get()
  findAll(@Query() query: QuerySegmentacionesWithPaginationDto) {
    return this.segmentacionService.findAll(query);
  }

  // 3. GET /segmentaciones/:id - Obtener una segmentación específica
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.segmentacionService.findOne(id);
  }

  // 4. PATCH /segmentaciones/:id - Actualizar segmentación
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateSegmentacionDto: UpdateSegmentacionDto
  ) {
    return this.segmentacionService.update(id, updateSegmentacionDto);
  }

  // 5. DELETE /segmentaciones/:id - Eliminar segmentación
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.segmentacionService.remove(id);
  }

  // 6. POST /segmentaciones/:id/subsegmentaciones - Agregar subsegmentación
  @Post(':id/subsegmentaciones')
  addSubSegmentacion(
    @Param('id', ParseIntPipe) id: number, 
    @Body() createSubSegmentacionDto: CreateTipoDto
  ) {
    return this.segmentacionService.addSubSegmentacion(id, createSubSegmentacionDto);
  }

  // 7. PATCH /segmentaciones/:segmentacionId/subsegmentaciones/:subSegmentacionId - Actualizar subsegmentación
  @Patch(':segmentacionId/subsegmentaciones/:subSegmentacionId')
  updateSubSegmentacion(
    @Param('segmentacionId', ParseIntPipe) segmentacionId: number,
    @Param('subSegmentacionId', ParseIntPipe) subSegmentacionId: number,
    @Body() updateSubSegmentacionDto: UpdatetipoDto
  ) {
    return this.segmentacionService.updateSubSegmentacion(
      segmentacionId, 
      subSegmentacionId, 
      updateSubSegmentacionDto
    );
  }

  // 8. DELETE /segmentaciones/:segmentacionId/subsegmentaciones/:subSegmentacionId - Eliminar subsegmentación
  @Delete(':segmentacionId/subsegmentaciones/:subSegmentacionId')
  removeSubSegmentacion(
    @Param('segmentacionId', ParseIntPipe) segmentacionId: number,
    @Param('subSegmentacionId', ParseIntPipe) subSegmentacionId: number
  ) {
    return this.segmentacionService.removeSubSegmentacion(segmentacionId, subSegmentacionId);
  }

}