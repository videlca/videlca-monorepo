import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../auth/decorators';
import { DescriptionRoutes } from '../auth/interfaces';

import { PaginationDto } from '../common/dto';

import { PeriodosService } from './periodos.service';
import { CreatePeriodoDto, UpdatePeriodoDto } from './dto';

@Controller('periodos')
@AppAuth(DescriptionRoutes.TARIFAS) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class PeriodosController {
  constructor(private readonly periodosService: PeriodosService) {}

  @Post()
  create(@Body() createPeriodoDto: CreatePeriodoDto) {
    return this.periodosService.create(createPeriodoDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.periodosService.findAll(paginationDto, paginationDto.pagination);
  }
  
  @Get('activo')
  @ValidateJwtAuth()
  findPeriodoActivo() {
    return this.periodosService.obtenerPeriodoActivo();
  }

  @Get('comparativa')
  compararPeriodos(
    @Query('periodoA', ParseIntPipe) periodoA: number,
    @Query('periodoB', ParseIntPipe) periodoB: number,
  ) {
    return this.periodosService.compararPeriodos(
      periodoA,
      periodoB,
    );
  }  

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.periodosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updatePeriodoDto: UpdatePeriodoDto) {
    return this.periodosService.update(id, updatePeriodoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.periodosService.remove(id);
  }
}
