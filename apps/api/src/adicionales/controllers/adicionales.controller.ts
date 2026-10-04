import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';

import { AppAuth, GetUser } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { User } from '../../users/entities/user.entity';

import { AdicionalesService } from '../services';
import { CreateAdicionalDto, UpdateAdicionalDto, FindAdicionalesDto } from '../dto';

@Controller('adicionales')
@AppAuth(DescriptionRoutes.ORDENES_SERVICIO) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class AdicionalesController {

  constructor(private readonly adicionalesService: AdicionalesService) {}

  @Post()
  create(
    @Body() createAdicionalDto: CreateAdicionalDto,
    @GetUser() user: User
  ) {
    return this.adicionalesService.create(createAdicionalDto, user);
  }

  @Get()
  findAll(@Query() findAdicionalesDto: FindAdicionalesDto) {
    return this.adicionalesService.findAll(findAdicionalesDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adicionalesService.findOne(id);
  }

  @Patch('cancelar/:id')
  cancelar(@Param('id', ParseIntPipe) id: number) {
    return this.adicionalesService.cancelar(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateAdicionalDto: UpdateAdicionalDto) {
    return this.adicionalesService.update(id, updateAdicionalDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adicionalesService.remove(id);
  }

}
