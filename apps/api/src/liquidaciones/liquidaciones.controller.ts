// liquidaciones.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
} from '@nestjs/common';
import { LiquidacionesService } from './liquidaciones.service';
import { UpdateLiquidacioneDto } from './dto/update-liquidacione.dto';
import { CreateLiquidacioneDto } from './dto/create-liquidacione.dto'
import { ApiTags, ApiQuery, ApiResponse } from '@nestjs/swagger';

@ApiTags('liquidaciones')
@Controller('liquidaciones')
export class LiquidacionesController {
  constructor(private readonly service: LiquidacionesService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Liquidación creada' })
  create(@Body() dto: CreateLiquidacioneDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'ordenId', required: false, example: 10, description: 'Filtra por idOrdenServicio' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('ordenId') ordenId?: string, // lo convertimos si viene
  ) {
    const oid = ordenId ? Number(ordenId) : undefined;
    return this.service.findAll({ page, limit, ordenId: oid });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLiquidacioneDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
  }
}