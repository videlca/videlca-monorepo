import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, DefaultValuePipe, Res } from '@nestjs/common';
import type { Response } from 'express';

import { AppAuth, GetUser, ValidateJwtAuth } from '../../auth/decorators';
import { DescriptionRoutes } from '../../auth/interfaces';

import { PaginationDto, EnviarCorreoDto } from '../../common/dto';

import { User } from '../../users/entities/user.entity';

import { OrdenServicioService } from '../services/orden-servicio.service';

import { 
  ValidarIdOrdenServicioDto,
  ValidarFechasOrdenServicioDto,
  ValidarHorarioServicioDto, 
  ValidarEmpleadosDisponiblesDto,
  ValidarRangoHorarioPersonalOrdenDto, 
  PrecioOrdenDto,
  UpdateValidarFechaOrdenServicioDto,
  CreateOrdenServicioDto,
  UpdateOrdenServicioDto,
} from '../dto';

import { ApiQuery } from '@nestjs/swagger';
import { LiquidacionesService } from '../../liquidaciones/services/liquidaciones.service';


@Controller('orden-servicio')
@AppAuth(DescriptionRoutes.ORDENES_SERVICIO) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class OrdenServicioController {
  constructor(
    private readonly ordenServicioService: OrdenServicioService,
    private liquidacionesService: LiquidacionesService
  ) {}

  @Post()
  create(
    @Body() createOrdenServicioDto: CreateOrdenServicioDto,
    @GetUser() user: User
  ) {
    return this.ordenServicioService.create(createOrdenServicioDto, user);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.ordenServicioService.findAll(paginationDto, paginationDto.pagination);
  }

  @Post('validacion-id')
  validarIdOrdenServicio(@Body() validarIdOrdenServicioDto: ValidarIdOrdenServicioDto) {
    return this.ordenServicioService.validarOrdenServicioId(validarIdOrdenServicioDto);
  }
  
  @Post('validacion-fechas')
  validarFechasOrdenServicio(@Body() validarFechasOrdenServicioDto: ValidarFechasOrdenServicioDto) {
    return this.ordenServicioService.validacionFechas(validarFechasOrdenServicioDto);
  }
  
  @Post('validacion-horarios')
  validacionHorarios(@Body() validarHorarioServicioDto: ValidarHorarioServicioDto) {
    return this.ordenServicioService.validacionHorarios(validarHorarioServicioDto);
  }

  @Post('obtener-precio')
  obtenerPrecioOrden(@Body() obtenerPrecioOrdenDto: PrecioOrdenDto){
    return this.ordenServicioService.obtenerPrecio(obtenerPrecioOrdenDto);
  }
  
  @Post('empleados-disponibles')
  validarEmpleadosDisponibles(@Body() validarEmpleadosDisponiblesDto: ValidarEmpleadosDisponiblesDto){
    return this.ordenServicioService.getEmpleadosDisponibles(validarEmpleadosDisponiblesDto);
  }
  
  @Post('validar-rango-horarios-orden')
  validarRangoHorariosPersonal(@Body() validarRangoHorarioEmpleado: ValidarRangoHorarioPersonalOrdenDto){
    return this.ordenServicioService.validarAsignaciones(validarRangoHorarioEmpleado);
  }
  
  @Post('update-validacion-fechas/:id')
  updateValidarFechasOrdenServicio(@Param('id', ParseIntPipe) id: number, @Body() updateValidarFechaOrdenServicioDto: UpdateValidarFechaOrdenServicioDto){
    return this.ordenServicioService.updateValidarFechasOrdenServicio(id, updateValidarFechaOrdenServicioDto);
  }
  
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordenServicioService.findOne(id);
  }
  
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateOrdenServicioDto: UpdateOrdenServicioDto) {
    return this.ordenServicioService.updateOrdenServicio(id, updateOrdenServicioDto);
  }
  
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ordenServicioService.removeOrdenServicio(id);
  }

  @Get(':ordenId/liquidaciones')
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  findLiquidacionesDeOrden(
    @Param('ordenId', ParseIntPipe) ordenId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.liquidacionesService.findAll({ page, limit, ordenId });
  }

  @Get(':ordenId/generar-pdf')
  async generarReporte(
    @Param('ordenId', ParseIntPipe) ordenId: number,
    @Res() res: Response
  ) {
    
    const {pdfDoc, title} = await this.ordenServicioService.downloadOrdenServicioPdf(ordenId);

    pdfDoc.info.Title = title;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${title}.pdf"`,
    );
    pdfDoc.pipe(res);
    pdfDoc.end();

  }
  
  @Post(':ordenId/enviar-pdf')
  enviarReporte(
    @Param('ordenId', ParseIntPipe) ordenId: number,
    @Body() enviarCorreoDto: EnviarCorreoDto
  ) {
    return this.ordenServicioService.sendOrdenServicioPdf(ordenId, enviarCorreoDto);
  }

}
