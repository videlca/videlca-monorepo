import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../../common/dto';

import { Servicio } from '../entities';


import { CreateServicioDto, UpdateServicioDto } from '../dto';
import { TipoDuracionInterface } from '../interfaces/tipo-duracion.interface';
import { TipoServicioService } from './tipo-servicio.service';
import { TipoDuracionService } from './tipo-duracion.service';
import { TipoHorarioDescripcionService } from './tipo-horario-descripcion.service';

@Injectable()
export class ServiciosService {

  private readonly logger = new Logger('ServiciosService');
        
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,
    private readonly tipoServicioService: TipoServicioService,
    private readonly tipoDuracionService: TipoDuracionService,
    private readonly tipoHorarioDescripcionService: TipoHorarioDescripcionService,
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }

  async create(createServicioDto: CreateServicioDto) {

    // OBTENER TIPO DE SERVICIO
    const tipoServicio = await this.tipoServicioService.findOne(createServicioDto.idTipoServicio);
    
    // OBTENER TIPO DE DURACION
    const tipoDuracion = await this.tipoDuracionService.findOne(createServicioDto.idTipoDuracion);

    // OBTENER TIPO HORARIO DESCRIPCION
    const tipoHorarioDescripcion = await this.tipoHorarioDescripcionService.findOne(createServicioDto.idTipoHorarioDescripcion);
    
    if (tipoDuracion.descripcion == TipoDuracionInterface.FIJA && !createServicioDto.horasFijas){
      throw new BadRequestException("El tipo de duracion requiere que se ingresen las horas fijas del servicio")
    }
    
    if (tipoDuracion.descripcion == TipoDuracionInterface.FLEXIBLE && !createServicioDto.horasMinimas){
      throw new BadRequestException("El tipo de duracion requiere que se ingresen las horas minimas")
    }

    if (createServicioDto.horasMaximas && createServicioDto.horasMaximas < createServicioDto.horasMinimas){
      throw new BadRequestException("El campo horas maximas no puede ser menor que el campo horas minimas");
    }

    if (createServicioDto.horasFijas && createServicioDto.horasFijas < 1){
      throw new BadRequestException("El campo horas fijas debe ser mayor a 0");
    }

    if (createServicioDto.horasMinimas && createServicioDto.horasMinimas < 1){
      throw new BadRequestException("El campo horas minimas debe ser mayor a 0");
    }

    if (createServicioDto.horasMaximas && createServicioDto.horasMaximas < 1){
      throw new BadRequestException("El campo horas maximas debe ser mayor a 0");
    }

    try {

      const servicio = this.servicioRepository.create({
        ...createServicioDto,
        idTipoServicio: tipoServicio,
        idTipoDuracion: tipoDuracion,
        idTipoHorarioDescripcion: tipoHorarioDescripcion
      });

      await this.servicioRepository.save(servicio);

      return servicio;
      
    } catch (error) {

      this.handleDbExceptions(error);
      
    }

  }

  async findAll(paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const servicios = await this.servicioRepository.find({
        take: limit,
        skip: offset,
      });
  
      return servicios;

    }

    return await this.servicioRepository.find({});

  }
  
  async findAllActives(paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const servicios = await this.servicioRepository.find({
        take: limit,
        skip: offset,
        where: {
          estado: true
        }
      });
  
      return servicios;

    }
    
    return await this.servicioRepository.find({
      where: {
          estado: true
      }
    });

  }

  async findOne(id: number) {
    
    const servicio = await this.servicioRepository.findOne({
      where: {
        idServicio: id
      }
    });
        
    if(!servicio) throw new NotFoundException(`Servicio con id "${id}" no se ha encontrado`);

    return servicio;

  }

  async update(id: number, updateServicioDto: UpdateServicioDto) {
    
    const { idTipoServicio, idTipoDuracion, idTipoHorarioDescripcion, ...servicioData } = updateServicioDto;

    const servicio = await this.servicioRepository.preload({idServicio: id, ...servicioData});

    if(!servicio) throw new NotFoundException(`Servicio con id "${id}" no encontrado`);

    if (updateServicioDto.idTipoServicio){
      
      // OBTENER TIPO DE SERVICIO
      const tipoServicio = await this.tipoServicioService.findOne(idTipoServicio);

      servicio.idTipoServicio = tipoServicio;
      
    }
    
    if (updateServicioDto.idTipoDuracion){
      
      // OBTENER TIPO DE DURACION
      const tipoDuracion = await this.tipoDuracionService.findOne(idTipoDuracion);

      if (tipoDuracion.descripcion == TipoDuracionInterface.FIJA && !updateServicioDto.horasFijas){
        throw new BadRequestException("El tipo de duracion requiere que se ingresen las horas fijas del servicio")
      }
      
      if (tipoDuracion.descripcion == TipoDuracionInterface.FLEXIBLE && !updateServicioDto.horasMinimas){
        throw new BadRequestException("El tipo de duracion requiere que se ingresen las horas minimas")
      }

      servicio.idTipoDuracion = tipoDuracion;
      
    }
    
    if (updateServicioDto.idTipoHorarioDescripcion){
      
      // OBTENER TIPO HORARIO DESCRIPCION
      const tipoHorarioDescripcion = await this.tipoHorarioDescripcionService.findOne(idTipoHorarioDescripcion);

      servicio.idTipoHorarioDescripcion = tipoHorarioDescripcion;
      
    }

    try {
      
      await this.servicioRepository.save(servicio);

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  async remove(id: number) {
    
    const servicio = await this.findOne(id);
    
    try {

      await this.servicioRepository.remove(servicio);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`El Servicio ${servicio.descripcion} no se puede eliminar debido a que se esta usando en el sistema`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }

  private handleDbExceptions(error: any){
      
    if (error.errno === 1062)
      throw new BadRequestException(`El registro que intenta crear ya existe, no puede crear duplicados`);

    this.logger.error(error);

    throw new InternalServerErrorException('Unexpected error, check server logs');

  }

  // ELIMINAR TODOS LOS SERVICIOS 
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA SERVICIOS
  async deleteAllServicios(){
  
    const query = this.servicioRepository.createQueryBuilder('servicio');

    try {
      
      return await query
        .delete()
        .where({})
        .execute();

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }
  
}
