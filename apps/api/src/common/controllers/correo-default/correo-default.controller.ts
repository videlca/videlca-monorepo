import { Body, Controller, Get, Post, Param, Patch, ParseIntPipe, Query, Delete } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../../auth/decorators';
import { DescriptionRoutes } from '../../../auth/interfaces';

import { CorreoDefaultService } from '../../services';
import { CorreoDefaultDto, PaginationDto } from '../../dto';

@Controller('correo-default')
@AppAuth(DescriptionRoutes.CONFIGURACION) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class CorreoDefaultController {

  constructor(private readonly correoDefaultService: CorreoDefaultService) {}
  
  @Post()
  create(@Body() correoDefaultDto: CorreoDefaultDto) {
    return this.correoDefaultService.create(correoDefaultDto);
  }
  
  @Get()
  @ValidateJwtAuth()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.correoDefaultService.findAll(paginationDto, paginationDto.pagination);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.correoDefaultService.findOne(id);
  }

}
