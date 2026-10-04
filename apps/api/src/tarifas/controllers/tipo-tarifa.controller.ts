import { Body, Controller, Get, Post, Param, Patch, ParseIntPipe, Query, Delete } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { PaginationDto } from '../../common/dto';

import { TipoTarifaService } from '../services/tipo-tarifa.service';
import { CreateTipoTarifaDto, UpdateTipoTarifaDto } from '../dto';

@Controller('tipo-tarifa')
@AppAuth(DescriptionRoutes.TARIFAS) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class TipoTarifaController {

  constructor(private readonly tipoTarifaService: TipoTarifaService) {}
  
  // RUTA PROTEGIDA: Crear un tipo tarifa
//   @Post()
//   create(@Body() createTipoTarifaDto: CreateTipoTarifaDto) {
//       return this.tipoTarifaService.create(createTipoTarifaDto);
//   }
  
  // RUTA PROTEGIDA: Obtener todos los tipos de tarifa
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.tipoTarifaService.findAll(paginationDto);
  }

  // RUTA PROTEGIDA: OBTENER UN TIPO TARIFA
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoTarifaService.findOne(id);
  }

  // RUTA PROTEGIDA: EDITAR UN TIPO TARIFA
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTipoTarifaDto: UpdateTipoTarifaDto) {
    return this.tipoTarifaService.update(id, updateTipoTarifaDto);
  }

//   // RUTA PROTEGIDA: ELIMINAR UN TIPO TARIFA
//   @Delete(':id')
//   remove(@Param('id', ParseIntPipe) id: number) {
//     return this.tipoTarifaService.remove(id);
//   }

}
