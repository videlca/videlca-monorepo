import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaginationDto } from '../../common/dto';
import { PaginationOption } from '../../common/interfaces/pagination.interface';

import { TipoNovedad } from '../entities';
import { CreateTipoDto, UpdatetipoDto } from '../../common/dto';
import { TipoEstadoPersonal } from '../interfaces/tipo-estado.interface';

@Injectable()
export class TipoNovedadService {

  private readonly logger = new Logger('TipoNovedadService');
    
  private defaultLimit: number; // valor de la cantidad por defecto que se va a retornar en una consulta 

  constructor(
    @InjectRepository(TipoNovedad)
    private readonly tipoNovedadRepository: Repository<TipoNovedad>,         
    private readonly configService: ConfigService,
  ) {
      this.defaultLimit = this.configService.get<number>('defaultLimit');
  }
  
  // CREAR TIPO NOVEDAD
  async create(createTipoNovedadDto: CreateTipoDto){

    if (createTipoNovedadDto.descripcion === TipoEstadoPersonal.RETIRADO) {
      throw new BadRequestException(`El Tipo Novedad "${createTipoNovedadDto.descripcion}" no puede ser creado porque es requerido por el sistema`);
    }
  
    try {
        
      const tipoNovedad = this.tipoNovedadRepository.create({
        descripcion: createTipoNovedadDto.descripcion,
      });
      
      await this.tipoNovedadRepository.save(tipoNovedad);

      return tipoNovedad;

    } catch (error) {
        
      this.handleDbExceptions(error);

    }

  }
  
  // OBTENER UN TIPO NOVEDAD
  async findOne(id: number){
  
    const tipoNovedad = await this.tipoNovedadRepository.findOneBy({idTipoNovedad: id});

    if(!tipoNovedad) throw new NotFoundException(`Tipo Novedad con id "${id}" no se ha encontrado`);

    return tipoNovedad;

  }
  
  // OBTENER UN TIPO NOVEDAD POR NOMBRE
  async findOneByName(name: string){
  
    const tipoNovedad = await this.tipoNovedadRepository.findOneBy({descripcion: name});

    if(!tipoNovedad) throw new NotFoundException(`Tipo Novedad con nombre "${name}" no se ha encontrado`);

    return tipoNovedad;

  }
  
  // OBTENER TODOS LOS TIPO NOVEDAD
  async findAll(paginationDto: PaginationDto) {
    
    if (paginationDto.pagination === PaginationOption.TRUE) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const [tiposNovedad, total] = await this.tipoNovedadRepository.findAndCount({
          take: limit,
          skip: offset,
          order: {
              descripcion: 'ASC'
          }
      });
  
      return {
        data: tiposNovedad,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0,
        }
      };

    }

    const tiposNovedad = await this.tipoNovedadRepository.find({
      order: {
        descripcion: 'ASC'
      }
    });

    return {
      data: tiposNovedad,
      pagination: {
        total: tiposNovedad.length,
        limit: tiposNovedad.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };
  
  }
  
  // OBTENER TODOS LOS TIPO NOVEDAD ACTIVOS
  async findAllActives(paginationDto: PaginationDto) {

    if (paginationDto.pagination === PaginationOption.TRUE) {

      // Si la variable limit no se envia, entonces se tomara el valor de defaultLimit
      const { limit = this.defaultLimit, offset = 0 } = paginationDto;
      
      // Se hace la consulta de manera paginada
      const [tiposNovedad, total] = await this.tipoNovedadRepository.findAndCount({
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
        data: tiposNovedad,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0,
        }
      };

    }
    
    const tiposNovedad = await this.tipoNovedadRepository.find({
        order: {
            descripcion: 'ASC'
        },
        where: {
            estado: true
        }
    });

    return {
      data: tiposNovedad,
      pagination: {
        total: tiposNovedad.length,
        limit: tiposNovedad.length,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    };

  }

  // EDITAR UN TIPO NOVEDAD
  async update(id: number, updateTipoEstadoDto: UpdatetipoDto) {
    
    const tipoNovedad = await this.tipoNovedadRepository.preload({idTipoNovedad: id, ...updateTipoEstadoDto});

    if (!tipoNovedad) throw new NotFoundException(`Tipo Novedad con id "${id}" no se ha encontrado`);

    if (tipoNovedad.retirado) {
      throw new BadRequestException(`El Tipo Novedad "${tipoNovedad.descripcion}" no puede ser modificado porque es requerido por el sistema`);
    }

    try {
      
      await this.tipoNovedadRepository.save(tipoNovedad);

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  async remove(id: number) {
    
    const tipoNovedad = await this.findOne(id);

    if (tipoNovedad.retirado) {
      throw new BadRequestException(`El Tipo Novedad "${tipoNovedad.descripcion}" no puede ser modificado porque es requerido por el sistema`);
    }
    
    try {

      await this.tipoNovedadRepository.remove(tipoNovedad);
      
    } catch (error) {
      
      this.logger.error(error);

      if(error.errno == 1451){
        throw new BadRequestException(`El Tipo Novedad ${tipoNovedad.descripcion} no se puede eliminar debido a que varias novedades lo tienen asignado`); 
      }
        
      throw new InternalServerErrorException(`Unexpected error, check server logs`);

    }

  }
  
  // ELIMINAR TODOS LOS TIPOS NOVEDAD
  // ESTA FUNCION ES UTILIZADA CUANDO SE EJECUTA EL SEED Y PODER LIMPIAR LA TABLA TIPO-NOVEDAD
  async deleteAllTiposNovedad(){
  
    const query = this.tipoNovedadRepository.createQueryBuilder('tipo-novedad');

    try {
      
      return await query
        .delete()
        .where({})
        .execute();

    } catch (error) {
      
      this.handleDbExceptions(error);

    }

  }

  async createTipoNovedadSeed(createTipoNovedadDto: {
    descripcion: string,
    retirado: boolean
  }){
  
    try {
        
      const tipoNovedad = this.tipoNovedadRepository.create({
        descripcion: createTipoNovedadDto.descripcion,
        retirado: createTipoNovedadDto.retirado
      });
      
      await this.tipoNovedadRepository.save(tipoNovedad);

      return tipoNovedad;

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
