import { Body, Controller, Get, Post, Param, Patch, ParseIntPipe, Query, Delete } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { PaginationDto } from '../../common/dto';

import { TipoContratoService } from '../services';
import { CreateTipoContratoDto, UpdatetipoContratoDto } from '../dto';

@Controller('tipo-contrato')
@AppAuth(DescriptionRoutes.CONFIGURACION) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class TipoContratoController {

  constructor(private readonly tipoContratoService: TipoContratoService) {}
  
  // RUTA PROTEGIDA: Crear un tipo de contrato
  @Post()
  create(@Body() createTipoContratoDto: CreateTipoContratoDto) {
      return this.tipoContratoService.create(createTipoContratoDto);
  }
  
  // RUTA PROTEGIDA: Obtener todos los tipos de contrato
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.tipoContratoService.findAll(paginationDto);
  }

  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS LOS TIPOS CONTRATO ACTIVOS
  @Get('actives')
  @ValidateJwtAuth()
  findAllActivas(@Query() paginationDto: PaginationDto) {
    return this.tipoContratoService.findAllActives(paginationDto);
  }

  // OBTENER UN TIPO CONTRATO
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoContratoService.findOne(id);
  }

  // EDITAR UN TIPO CONTRATO
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTipoContratoDto: UpdatetipoContratoDto) {
    return this.tipoContratoService.update(id, updateTipoContratoDto);
  }

  // ELIMINAR UN TIPO CONTRATO
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tipoContratoService.remove(id);
  }

}
