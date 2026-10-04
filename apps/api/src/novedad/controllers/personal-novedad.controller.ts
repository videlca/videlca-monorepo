import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';

import { AppAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { NovedadService } from '../services/novedad.service';
import { CreateNovedadDto } from '../dto';

@Controller('personal/:personalId/novedades')
@AppAuth(DescriptionRoutes.PERSONAL)
export class PersonalNovedadesController {
  constructor(private readonly novedadService: NovedadService) {}

    @Post()
    create(
        @Param('personalId', ParseIntPipe) personalId: number,
        @Body() createNovedadDto: CreateNovedadDto
    ) {
        return this.novedadService.create(createNovedadDto, personalId);
    }

    @Get()
    findAllByPersonal(@Param('personalId', ParseIntPipe) personalId: number) {
        return this.novedadService.findAllByPersonal(personalId);
    }

}
