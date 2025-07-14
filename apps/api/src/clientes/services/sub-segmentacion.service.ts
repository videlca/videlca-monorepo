import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { UpdatetipoDto } from '../../common/dto';

import { SubSegmentacion } from '../entities';
import { QuerySubSegmentacionesWithPaginationDto } from '../dto';

@Injectable()
export class SubSegmentacionService {

  private readonly logger = new Logger('SubSegmentacionService');
    
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(SubSegmentacion)
    private readonly subSegmentacionRepository: Repository<SubSegmentacion>,                 
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }
  
  async findAll(query: QuerySubSegmentacionesWithPaginationDto) {

    const queryOptions: any = {
      where: {},
    };

    // Filtrar por segmentación si se proporciona
    if (query.segmentacionId) {
      queryOptions.where.segmentacion = { idSegmentacion: query.segmentacionId };
    }

    // Filtrar solo activos si se solicita
    if (query.soloActivos) {
      queryOptions.where.estado = true;
    }

    if (query.pagination) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = query;
      
      // Se hace la consulta de manera paginada
      const subSegmentaciones = await this.subSegmentacionRepository.find({
          ...queryOptions,
          take: limit,
          skip: offset
      });
  
      return subSegmentaciones;

    }

    return await this.subSegmentacionRepository.find(queryOptions);
  }

  async findOne(id: number) {
    
    const subSegmentacion = await this.subSegmentacionRepository.findOne({
      where: { idSubSegmentacion: id },
    });

    if (!subSegmentacion) {
      throw new NotFoundException(`SubSegmentación con id "${id}" no encontrada`);
    }

    return subSegmentacion;
  }

  async update(id: number, updateSubSegmentacionDto: UpdatetipoDto) {

    const subSegmentacionToUpdate = await this.subSegmentacionRepository.preload({
      idSubSegmentacion: id,
      ...updateSubSegmentacionDto,
    });

    if (!subSegmentacionToUpdate) {
      throw new NotFoundException(`SubSegmentación con id "${id}" no encontrada`);
    }

    // Guardar y retornar
    return await this.subSegmentacionRepository.save(subSegmentacionToUpdate);
  }

  async remove(id: number) {
    
    const subSegmentacion = await this.findOne(id);
    
    try {

      await this.subSegmentacionRepository.remove(subSegmentacion);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`La SubSegmentacion ${subSegmentacion.descripcion} no se puede eliminar debido a que se esta usando en el sistema`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }

}