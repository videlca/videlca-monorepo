import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';

import { AppAuth, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { PaginationDto } from '../../common/dto';

import { PersonalService } from '../services/personal.service';
import { CreatePersonalDto, UpdatePersonalDto } from '../dto';

@Controller('personal')
@AppAuth(DescriptionRoutes.PERSONAL) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class PersonalController {
  constructor(private readonly personalService: PersonalService) {}
  
  // RUTA PROTEGIDA: Crear un Personal
  @Post()
  create(@Body() createPersonalDto: CreatePersonalDto) {
    return this.personalService.create(createPersonalDto);
  }
  
  // RUTA PROTEGIDA: Obtener todos los empleados
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.personalService.findAll(paginationDto);
  }
  
  // RUTA PUBLICA (para ver desde otra pantalla o dropdown): OBTENER TODOS EMPLEADOS QUE ESTAN LABORANDO
  @Get('actives')
  @ValidateJwtAuth()
  findAllActivos(@Query() paginationDto: PaginationDto) {
    return this.personalService.findAllActives(paginationDto);
  }
  
  // RUTA PROTEGIDA: OBTENER UN EMPLEADO
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.personalService.findOne(id);
  }
  
  // RUTA PROTEGIDA: ACTUALIZAR INFORMACION DE UN EMPLEADO
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updatePersonalDto: UpdatePersonalDto) {
    return this.personalService.update(id, updatePersonalDto);
  }
  
  // RUTA PROTEGIDA: ELIMINAR UN EMPLEADO
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.personalService.remove(id);
  }
}
