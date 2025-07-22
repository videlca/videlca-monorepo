import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { CreateTipoDto, UpdatetipoDto } from '../../common/dto';

import { Segmentacion, SubSegmentacion } from '../entities';
import { CreateSegmentacionDto, UpdateSegmentacionDto, QuerySegmentacionesWithPaginationDto } from '../dto';

@Injectable()
export class SegmentacionService {

  private readonly logger = new Logger('SegmentacionService');
    
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(Segmentacion)
    private readonly segmentacionRepository: Repository<Segmentacion>,         
    @InjectRepository(SubSegmentacion)
    private readonly subSegmentacionRepository: Repository<SubSegmentacion>,         
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }
  
  // CREAR SEGMENTACION
  async create(createSegmentacionDto: CreateSegmentacionDto){
  
    try {

      const { subSegmentaciones = [], ...segmentacionData } = createSegmentacionDto;
        
      const segmentacion = this.segmentacionRepository.create({
        ...segmentacionData,
        subSegmentaciones: subSegmentaciones.map(subSeg => 
            this.subSegmentacionRepository.create(subSeg)
        )
      });
      
      await this.segmentacionRepository.save(segmentacion);

      return segmentacion;

    } catch (error) {
        
      this.handleDbExceptions(error);

    }

  }

  // OBTENER TODOS LAS SEGMENTACIONES
  async findAll(query: QuerySegmentacionesWithPaginationDto) {

    const queryOptions: any = {
      where: {},
      order: {
        descripcion: 'ASC'
      },
      relations: {
        subSegmentaciones: true
      }
    };

    // Incluir subsegmentaciones si se solicita
    if (query.includeSubSegmentaciones) {
      queryOptions.relations = {
        subSegmentaciones: true
      };
    }

    // Filtrar solo activos si se solicita
    if (query.soloActivos) {
      queryOptions.where.estado = true;
    }
    
    if (query.pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = query;
      
      // Se hace la consulta de manera paginada
      const segmentaciones = await this.segmentacionRepository.find({
          ...queryOptions,
          take: limit,
          skip: offset,
          relations: {
            subSegmentaciones: true
          }
      });
  
      return segmentaciones;

    }

    return await this.segmentacionRepository.find(queryOptions);
  
  }
  
  // OBTENER UNA SEGMENTACION
  async findOne(id: number){
  
    const segmentacion = await this.segmentacionRepository.findOne({
        where: {
            idSegmentacion: id
        },
        relations: {
            subSegmentaciones: true
        }
    });

    if(!segmentacion) throw new NotFoundException(`Segmentacion con id "${id}" no se ha encontrado`);

    return segmentacion;

  }
  
  // OBTENER UNA SEGMENTACION POR NOMBRE
  async findOneByName(name: string){
  
    const segmentacion = await this.segmentacionRepository.findOneBy({descripcion: name});

    if(!segmentacion) throw new NotFoundException(`Segmentacion con nombre "${name}" no se ha encontrado`);

    return segmentacion;

  }
  

  // EDITAR UNA SEGMENTACION
  async update(id: number, updateSegmentacionDto: UpdateSegmentacionDto) {
    
    const segmentacion = await this.segmentacionRepository.preload({idSegmentacion: id, ...updateSegmentacionDto});

    if (!segmentacion) throw new NotFoundException(`Segmentacion con id "${id}" no se ha encontrado`);

    try {
      
      await this.segmentacionRepository.save(segmentacion);

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  // ELIMINAR UNA SEGMENTACION
  async remove(id: number) {
    
    const segmentacion = await this.findOne(id);
    
    try {

      await this.segmentacionRepository.remove(segmentacion);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`La segmentacion ${segmentacion.descripcion} no se puede eliminar debido a que se esta usando en el sistema`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }


  // AGREGAR SUBSEGMENTACION
  async addSubSegmentacion(segmentacionId: number, createSubSegmentacionDto: CreateTipoDto) {
    
    // Verificar que la segmentación existe
    const segmentacion = await this.segmentacionRepository.findOne({
        where: { 
            idSegmentacion: segmentacionId 
        }
    });

    if (!segmentacion) {
      throw new NotFoundException(`Segmentación con id "${segmentacionId}" no encontrada`);
    }

    // Crear la subsegmentación
    const subSegmentacion = this.subSegmentacionRepository.create({
      ...createSubSegmentacionDto,
      segmentacion: segmentacion
    });

    return await this.subSegmentacionRepository.save(subSegmentacion);
  }
    

  async updateSubSegmentacion(segmentacionId: number, subSegmentacionId: number, updateSubSegmentacionDto: UpdatetipoDto) {
    
    // Buscar directamente la subsegmentación que pertenezca a la segmentación
    const subSegmentacion = await this.subSegmentacionRepository.findOne({
      where: { 
        idSubSegmentacion: subSegmentacionId,
        segmentacion: { idSegmentacion: segmentacionId }
      }
    });

    if (!subSegmentacion) {
      throw new NotFoundException(
        `SubSegmentación con id "${subSegmentacionId}" no encontrada en la Segmentación "${segmentacionId}"`
      );
    }

    // Usar preload para combinar datos existentes con nuevos datos
    const subSegmentacionToUpdate = await this.subSegmentacionRepository.preload({
      idSubSegmentacion: subSegmentacionId,
      ...updateSubSegmentacionDto,
    });

    if (!subSegmentacionToUpdate) {
      throw new NotFoundException(`SubSegmentación con id "${subSegmentacionId}" no encontrada`);
    }

    // Guardar y retornar
    return await this.subSegmentacionRepository.save(subSegmentacionToUpdate);
  }

  async removeSubSegmentacion(segmentacionId: number, subSegmentacionId: number) {
    
    // Verificar que existe y pertenece a la segmentación correcta
    const subSegmentacion = await this.subSegmentacionRepository.findOne({
      where: { 
        idSubSegmentacion: subSegmentacionId,
        segmentacion: { idSegmentacion: segmentacionId }
      }
    });

    if (!subSegmentacion) {
      throw new NotFoundException(
        `SubSegmentación con id "${subSegmentacionId}" no encontrada en la Segmentación "${segmentacionId}"`
      );
    }

    try {

      await this.subSegmentacionRepository.remove(subSegmentacion);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`La Sub Segmentacion ${subSegmentacion.descripcion} no se puede eliminar debido a que se esta usando en el sistema`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }

  
  // ELIMINAR TODOS LAS SEGMENTACIONES -> SUBSEGMENTACIONES
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA SEGMENTACIONES
  async deleteAllSegmentaciones(){
  
    const query = this.segmentacionRepository.createQueryBuilder('segmentacion');

    try {
      
      return await query
        .delete()
        .where({})
        .execute();

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