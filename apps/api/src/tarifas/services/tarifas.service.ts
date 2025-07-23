import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { ServiciosService } from '../../servicios/services';
import { PeriodosService } from '../../periodos/periodos.service';

import { PaginationDto } from '../../common/dto';

import { Tarifa } from '../entities';
import { TipoTarifaService } from './tipo-tarifa.service';

import { CreateTarifaDto, UpdateTarifaDto } from '../dto';

@Injectable()
export class TarifasService {

  private readonly logger = new Logger('TarifasService');
        
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(Tarifa)
    private readonly tarifaRepository: Repository<Tarifa>,
    private readonly tipoTarifaService: TipoTarifaService,
    private readonly servicioService: ServiciosService,
    private readonly periodoService: PeriodosService,
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }

  async create(createTarifaDto: CreateTarifaDto) {

    // OBTENER TIPO DE TARIFA
    const tipoTarifa = await this.tipoTarifaService.findOne(createTarifaDto.idTipoTarifa);
    
    // OBTENER SERVICIO
    const servicio = await this.servicioService.findOne(createTarifaDto.idServicio);

    // OBTENER PERIODO
    const periodo = await this.periodoService.findOne(createTarifaDto.idPeriodo);

    try {

      const tarifa = this.tarifaRepository.create({
        ...createTarifaDto,
        idTipoTarifa: tipoTarifa,
        idServicio: servicio,
        idPeriodo: periodo
      });

      await this.tarifaRepository.save(tarifa);

      return tarifa;
      
    } catch (error) {

      this.handleDbExceptions(error);
      
    }

  }

  async findAllByPeriodo(id: number, paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const tarifas = await this.tarifaRepository.find({
        take: limit,
        skip: offset,
        where: {
          idPeriodo: {
            idPeriodo: id
          }
        }
      });
  
      return tarifas;

    }

    return await this.tarifaRepository.find({
      where: {
        idPeriodo: {
          idPeriodo: id
        }
      }
    });

  }
  
  async findAllActivesByPeriodo(id: number, paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const servicios = await this.tarifaRepository.find({
        take: limit,
        skip: offset,
        where: {
          estado: true,
          idPeriodo: {
            idPeriodo: id
          }
        }
      });
  
      return servicios;

    }
    
    return await this.tarifaRepository.find({
      where: {
        estado: true,
        idPeriodo: {
          idPeriodo: id
        }
      }
    });

  }

  async findOne(id: number) {
    
    const tarifa = await this.tarifaRepository.findOne({
      where: {
        idTarifa: id
      }
    });
        
    if(!tarifa) throw new NotFoundException(`Tarifa con id "${id}" no se ha encontrado`);

    return tarifa;

  }

  async update(id: number, updateTarifaDto: UpdateTarifaDto) {
    
    const { idTipoTarifa, idServicio, idPeriodo, ...tarifaData } = updateTarifaDto;

    const tarifa = await this.tarifaRepository.preload({idTarifa: id, ...tarifaData});

    if(!tarifa) throw new NotFoundException(`Tarifa con id "${id}" no encontrado`);

    if (updateTarifaDto.idTipoTarifa){
      
      // OBTENER TIPO DE TARIFA
      const tipoTarifa = await this.tipoTarifaService.findOne(idTipoTarifa);

      tarifa.idTipoTarifa = tipoTarifa;
      
    }
    
    if (updateTarifaDto.idServicio){
      
      // OBTENER SERVICIO
      const servicio = await this.servicioService.findOne(idServicio);

      tarifa.idServicio = servicio;
      
    }
    

    try {
      
      await this.tarifaRepository.save(tarifa);

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  async remove(id: number) {
    
    const tarifa = await this.findOne(id);
    
    try {

      await this.tarifaRepository.remove(tarifa);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`La tarifa no se puede eliminar debido a que se esta usando en el sistema`); 
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

  // ELIMINAR TODOS LAS TARIFAS
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA TARIFAS
  async deleteAllTarifas(){
  
    const query = this.tarifaRepository.createQueryBuilder('tarifa');

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
