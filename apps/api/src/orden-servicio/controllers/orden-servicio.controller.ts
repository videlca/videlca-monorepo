import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrdenServicioService } from '../services/orden-servicio.service';
import { CreateOrdenServicioDto } from '../dto/orden-servicio/create-orden-servicio.dto';
import { UpdateOrdenServicioDto } from '../dto/orden-servicio/update-orden-servicio.dto';

@Controller('orden-servicio')
export class OrdenServicioController {
  constructor(private readonly ordenServicioService: OrdenServicioService) {}

  @Post()
  create(@Body() createOrdenServicioDto: CreateOrdenServicioDto) {
    return this.ordenServicioService.create(createOrdenServicioDto);
  }

  @Get()
  findAll() {
    return this.ordenServicioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordenServicioService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrdenServicioDto: UpdateOrdenServicioDto) {
    return this.ordenServicioService.update(+id, updateOrdenServicioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordenServicioService.remove(+id);
  }
}
