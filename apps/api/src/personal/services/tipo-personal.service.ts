import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../../common/dto';
import { PaginationOption } from '../../common/interfaces/pagination.interface';

import { TipoPersonal } from '../entities';
import { CreateTipoDto, UpdatetipoDto } from '../../common/dto';

@Injectable()
export class TipoPersonalService {

  private readonly logger = new Logger('TipoPersonalService');
    
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(TipoPersonal)
    private readonly tipoPersonalRepository: Repository<TipoPersonal>,         
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }
  
  // CREAR TIPO PERSONAL
  async create(createTipoPersonalDto: CreateTipoDto){
  
    try {
        
      const tipoPersonal = this.tipoPersonalRepository.create({
        descripcion: createTipoPersonalDto.descripcion,
      });
      
      await this.tipoPersonalRepository.save(tipoPersonal);

      return tipoPersonal;

    } catch (error) {
        
      this.handleDbExceptions(error);

    }

  }
  
  // OBTENER UN TIPO PERSONAL
  async findOne(id: number){
  
    const tipoPersonal = await this.tipoPersonalRepository.findOneBy({idTipoPersonal: id});

    if(!tipoPersonal) throw new NotFoundException(`Tipo de Personal con id "${id}" no se ha encontrado`);

    return tipoPersonal;

  }
  
  // OBTENER UN TIPO PERSONAL por nombre
  async findOneByName(name: string){
  
    const tipoPersonal = await this.tipoPersonalRepository.findOneBy({descripcion: name});

    if(!tipoPersonal) throw new NotFoundException(`Tipo de Personal con nombre "${name}" no se ha encontrado`);

    return tipoPersonal;

  }
  
  // OBTENER TODOS LOS TIPO PERSONAL
  async findAll(paginationDto: PaginationDto) {
    
    if (paginationDto.pagination === PaginationOption.TRUE) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const [tiposPersonal, total] = await this.tipoPersonalRepository.findAndCount({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          }
      });
  
      return {
        data: tiposPersonal,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0
        }
      };

    }

    const tiposPersonal = await this.tipoPersonalRepository.find({
      order: {
        descripcion: 'ASC'
      }
    });

    return {
      data: tiposPersonal,
      pagination: {
        total: tiposPersonal.length,
        limit: tiposPersonal.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };
  
  }
  
  // OBTENER TODOS LOS TIPO PERSONAL ACTIVOS
  async findAllActives(paginationDto: PaginationDto) {

    if (paginationDto.pagination === PaginationOption.TRUE) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const [tiposPersonal, total] = await this.tipoPersonalRepository.findAndCount({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          },
          where: {
            estado: true
          }
      });
  
      return {
        data: tiposPersonal,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0
        }
      };

    }
    
    const tiposPersonal = await this.tipoPersonalRepository.find({
        order: {
            descripcion: 'ASC'
        },
        where: {
            estado: true
        }
    });

    return {
      data: tiposPersonal,
      pagination: {
        total: tiposPersonal.length,
        limit: tiposPersonal.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };

  }

  // EDITAR UN TIPO PERSONAL
  async update(id: number, updateTipoPersonalDto: UpdatetipoDto) {
    
    const tipoPersonal = await this.tipoPersonalRepository.preload({idTipoPersonal: id, ...updateTipoPersonalDto});

    if (!tipoPersonal) throw new NotFoundException(`Tipo de Personal con id "${id}" no se ha encontrado`);

    try {
      
      await this.tipoPersonalRepository.save(tipoPersonal);

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  async remove(id: number) {
    
    const tipoPersonal = await this.findOne(id);
    
    try {

      await this.tipoPersonalRepository.remove(tipoPersonal);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`El Tipo personal ${tipoPersonal.descripcion} no se puede eliminar debido a que varios usuarios lo tienen asignado`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }
  
  // ELIMINAR TODOS LOS TIPOS PERSONAL
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA TIPO-PERSONAL
  async deleteAllTiposPersonal(){
  
    const query = this.tipoPersonalRepository.createQueryBuilder('tipo-personal');

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
