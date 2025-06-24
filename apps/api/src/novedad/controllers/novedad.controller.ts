import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { PaginationDto } from '../../common/dto';

import { NovedadService } from '../services';
import { UpdateNovedadDto } from '../dto';

@Controller('novedades')
@AppAuth(DescriptionRoutes.PERSONAL)
export class NovedadController {
  constructor(private readonly novedadService: NovedadService) {}

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.novedadService.findAll(paginationDto, paginationDto.pagination);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.novedadService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateNovedadDto: UpdateNovedadDto) {
    return this.novedadService.update(id, updateNovedadDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.novedadService.remove(id);
  }
}
