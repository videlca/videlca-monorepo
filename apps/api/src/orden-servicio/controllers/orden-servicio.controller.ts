import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, DefaultValuePipe, Res, UploadedFiles, UseFilters, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
  GetReporteInicioDto,
  FilterOrdenServicioDto
} from '../dto';

import { ApiQuery } from '@nestjs/swagger';
import { CrearOrdenConNotificacionDto, type ArchivoSubido } from '../dto/orden-servicio/crear-orden-con-notificacion.dto';
import { MAX_BYTES_IMAGENES_CORREO, MAX_IMAGENES_CORREO, validarCreacionMultipart } from '../helpers/creacion-multipart.helper';
import { ErroresSubidaFilter } from '../helpers/errores-subida.filter';
import { LiquidacionesService } from '../../liquidaciones/services/liquidaciones.service';


@Controller('orden-servicio')
@AppAuth(DescriptionRoutes.ORDENES_SERVICIO) // RUTAS PROTEGIDAS EN ESTE CONTROLLER
export class OrdenServicioController {
  constructor(
    private readonly ordenServicioService: OrdenServicioService,
    private liquidacionesService: LiquidacionesService
  ) {}

  // CREAR ORDEN + CORREO DE CREACION (multipart/form-data): "orden" (CreateOrdenServicioDto en JSON), "mensaje"
  // (opcional), "destinatarios" (arreglo JSON de correos, al menos uno) e "imagenes" (hasta 5, 3 MB en total, solo
  // viajan en el correo). El correo se envia antes de confirmar la orden: si falla, la orden no se guarda
  @Post()
  @UseFilters(ErroresSubidaFilter)
  @UseInterceptors(
    FilesInterceptor('imagenes', MAX_IMAGENES_CORREO, {
      limits: { fileSize: MAX_BYTES_IMAGENES_CORREO, files: MAX_IMAGENES_CORREO },
    }),
  )
  async create(
    @Body() body: CrearOrdenConNotificacionDto,
    @UploadedFiles() imagenes: ArchivoSubido[],
    @GetUser() user: User
  ) {
    const { orden, notificacion } = await validarCreacionMultipart(body, imagenes ?? []);
    return this.ordenServicioService.create(orden, user, notificacion);
  }

  // DESTINATARIOS DEL CORREO DE CREACION (paso final de crear una orden): contactos del puesto, del cliente y
  // correos de aplicacion con el estado "creacion orden de servicio", sin repetidos
  @Get('destinatarios-creacion')
  @ApiQuery({ name: 'idLocacion', required: false })
  @ApiQuery({ name: 'idCliente', required: false })
  findDestinatariosCreacion(
    @Query('idLocacion', new ParseIntPipe({ optional: true })) idLocacion?: number,
    @Query('idCliente', new ParseIntPipe({ optional: true })) idCliente?: number,
  ) {
    return this.ordenServicioService.findDestinatariosCreacion(idLocacion, idCliente);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.ordenServicioService.findAll(paginationDto);
  }

  @Get('filter')
  findFiltered(@Query() filterOrdenServicioDto: FilterOrdenServicioDto) {
    return this.ordenServicioService.findFiltered(
      filterOrdenServicioDto
    );
  }

  @Get('inicio')
  @ValidateJwtAuth()
  async getReportes(@Query() query: GetReporteInicioDto) {
    return this.ordenServicioService.reportesInicio(query.months);
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
  
  @Post('validar-rango-horarios-orden')
  validarRangoHorariosPersonal(@Body() validarRangoHorarioEmpleado: ValidarRangoHorarioPersonalOrdenDto){
    return this.ordenServicioService.validarAsignaciones(validarRangoHorarioEmpleado);
  }
  
  @Post('update-validacion-fechas/:id')
  updateValidarFechasOrdenServicio(@Param('id', ParseIntPipe) id: number, @Body() updateValidarFechaOrdenServicioDto: UpdateValidarFechaOrdenServicioDto){
    return this.ordenServicioService.updateValidarFechasOrdenServicio(id, updateValidarFechaOrdenServicioDto);
  }

  @Patch('cancelar-orden/:id')
  cancelarOrden(@Param('id', ParseIntPipe) id: number) {
    return this.ordenServicioService.cancelarOrdenServicio(id);
  }

  @Patch('anular-orden/:id')
  anularOrden(@Param('id', ParseIntPipe) id: number) {
    return this.ordenServicioService.anularOrdenServicio(id);
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

  // MESES YA LIQUIDADOS DE LA ORDEN (para advertir al editarla: la edicion solo aplica a los meses no liquidados)
  @Get(':id/meses-liquidados')
  findMesesLiquidados(@Param('id', ParseIntPipe) id: number) {
    return this.ordenServicioService.findMesesLiquidados(id);
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
  
  
  @Post(':ordenId/imprimir-pdf')
  imprimirReporte(
    @Param('ordenId', ParseIntPipe) ordenId: number
  ) {
    return this.ordenServicioService.imprimirOrdenServicio(ordenId);
  }

}
