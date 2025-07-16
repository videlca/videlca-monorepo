import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { EstadoOrdenServicio } from '../../entities';
import { CreateTipoDto, UpdateEstadoOrdenDto, PaginationDto } from '../../dto';

@Injectable()
export class EstadoOrdenServicioService {

  private readonly logger = new Logger('EstadoOrdenServicioService');
    
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(EstadoOrdenServicio)
    private readonly estadoOrdenRepository: Repository<EstadoOrdenServicio>,         
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }
  
  // CREAR ESTADO ORDEN SERVICIO
  async create(createEstadoOrdenDto: CreateTipoDto){
  
    try {
        
      const estadoOrden = this.estadoOrdenRepository.create({
        descripcion: createEstadoOrdenDto.descripcion,
      });
      
      await this.estadoOrdenRepository.save(estadoOrden);

      return estadoOrden;

    } catch (error) {
        
      this.handleDbExceptions(error);

    }

  }
  
  // OBTENER UN ESTADO ORDEN
  async findOne(id: number){
  
    const estadoOrden = await this.estadoOrdenRepository.findOneBy({idEstadoOrdenServicio: id});

    if(!estadoOrden) throw new NotFoundException(`Estado Orden de Servicio con id "${id}" no se ha encontrado`);

    return estadoOrden;

  }
  
  // OBTENER UN ESTADO ORDEN DE SERVICIO POR NOMBRE
  async findOneByName(name: string){
  
    const estadoOrden = await this.estadoOrdenRepository.findOneBy({descripcion: name});

    if(!estadoOrden) throw new NotFoundException(`Estado Orden de Servicio con nombre "${name}" no se ha encontrado`);

    return estadoOrden;

  }
  
  // OBTENER TODOS LOS ESTADOS ORDENES DE SERVICIO
  async findAll(paginationDto: PaginationDto, pagination: boolean = true) {
    
    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const estadosOrden = await this.estadoOrdenRepository.find({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          }
      });
  
      return estadosOrden;

    }

    return await this.estadoOrdenRepository.find({
      order: {
        descripcion: 'ASC'
      }
    });
  
  }
  
  // OBTENER TODOS LOS ESTADOS ORDEN ACTIVOS
  async findAllActives(paginationDto: PaginationDto, pagination: boolean = true) {

    if (pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const estadosOrden = await this.estadoOrdenRepository.find({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          },
          where: {
            estado: true
          }
      });
  
      return estadosOrden;

    }
    
    return await this.estadoOrdenRepository.find({
      order: {
        descripcion: 'ASC'
      },
      where: {
        estado: true
      }
    });

  }

  // EDITAR UN ESTADO ORDEN
  async update(id: number, updateEstadoOrdenDto: UpdateEstadoOrdenDto) {
    
    const estadoOrden = await this.estadoOrdenRepository.preload({idEstadoOrdenServicio: id, ...updateEstadoOrdenDto});

    if (!estadoOrden) throw new NotFoundException(`Estado Orden de Servicio con id "${id}" no se ha encontrado`);

    try {
      
      await this.estadoOrdenRepository.save(estadoOrden);

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  // ELIMINAR UN ESTADO ORDEN
  async remove(id: number) {
    
    const estadoOrden = await this.findOne(id);
    
    try {

      await this.estadoOrdenRepository.remove(estadoOrden);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`El tipo id ${estadoOrden.descripcion} no se puede eliminar debido a que se esta usando en el sistema`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }
  
  // ELIMINAR TODOS LOS ESTADOS ORDEN
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA ESTADO-ORDEN
  async deleteAllTiposEstadosOrden(){
  
    const query = this.estadoOrdenRepository.createQueryBuilder('estado-orden');

    try {
      
      return await query
        .delete()
        .where({})
        .execute();

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  // CREAR ESTADO ORDEN SERVICIO
  async createEstadoOrdenSeed(createEstadoOrdenDto: {
    descripcion: string,
    estado: boolean,
    programable: boolean,
    dias: number
  }){
  
    try {
        
      const estadoOrden = this.estadoOrdenRepository.create({
        descripcion: createEstadoOrdenDto.descripcion,
        estado: createEstadoOrdenDto.estado,
        programable: createEstadoOrdenDto.programable,
        dias: createEstadoOrdenDto.dias
      });
      
      await this.estadoOrdenRepository.save(estadoOrden);

      return estadoOrden;

    } catch (error) {
        
      this.handleDbExceptions(error);

    }

  }

  private handleDbExceptions(error: any){
  
    if (error.errno === 1062)
      throw new BadRequestException(`El registro que intenta crear ya existe, no puede crear duplicados`);

    this.logger.error(error);

    throw new InternalServerErrorException('Unexpected error, check server logs');

  }

}
